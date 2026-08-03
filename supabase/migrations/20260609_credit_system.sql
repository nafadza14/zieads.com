-- ─────────────────────────────────────────────────────────────
-- ZieAds Credit System — Supabase Migration
-- Created: 2026-06-09
-- ─────────────────────────────────────────────────────────────

-- ── 1. user_plan ─────────────────────────────────────────────
-- Tracks each user's plan, billing anchor, and Stripe references.
CREATE TABLE IF NOT EXISTS user_plan (
  user_id               UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id               TEXT        NOT NULL DEFAULT 'free',
  plan_started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  billing_anchor_day    INT         NOT NULL DEFAULT 0,  -- 0 = 1st of month (free), else day of month subscription started
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT
);

ALTER TABLE user_plan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_plan_self" ON user_plan
  USING (user_id = auth.uid());

-- ── 2. user_credits ──────────────────────────────────────────
-- Live credit balances. skill_run_monthly_remaining = -1 means unlimited (Agency).
CREATE TABLE IF NOT EXISTS user_credits (
  user_id                        UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_chat_daily_remaining        INT         NOT NULL DEFAULT 5,
  ai_chat_daily_last_reset       TIMESTAMPTZ NOT NULL DEFAULT now(),
  skill_run_monthly_remaining    INT         NOT NULL DEFAULT 10,  -- -1 = unlimited
  skill_run_monthly_last_reset   TIMESTAMPTZ NOT NULL DEFAULT now(),
  lifetime_ai_messages_sent      BIGINT      NOT NULL DEFAULT 0,
  lifetime_skill_runs            BIGINT      NOT NULL DEFAULT 0
);

ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_credits_self" ON user_credits
  USING (user_id = auth.uid());

-- ── 3. credit_transactions ────────────────────────────────────
-- Immutable append-only log. Used for auditing, analytics, dispute resolution.
CREATE TABLE IF NOT EXISTS credit_transactions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type  TEXT        NOT NULL CHECK (transaction_type IN ('deduct','reset','grant','refund','upgrade_adjustment')),
  credit_pool       TEXT        NOT NULL CHECK (credit_pool IN ('ai_chat_daily','skill_run_monthly')),
  operation_id      TEXT,
  credits_delta     INT         NOT NULL,  -- negative for deductions, positive for grants/resets
  credits_before    INT         NOT NULL,
  credits_after     INT         NOT NULL,
  plan_id_at_time   TEXT        NOT NULL DEFAULT 'free',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata          JSONB
);

-- Index for efficient per-user time-ordered queries
CREATE INDEX IF NOT EXISTS credit_transactions_user_time
  ON credit_transactions (user_id, created_at DESC);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credit_transactions_self" ON credit_transactions
  USING (user_id = auth.uid());

-- ── 4. Trigger: auto-provision credits & plan on new user ────
-- When a user signs up (row inserted into auth.users), create their free-tier records.
CREATE OR REPLACE FUNCTION handle_new_user_credits()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_plan (user_id, plan_id, billing_anchor_day)
  VALUES (NEW.id, 'free', 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO user_credits (user_id, ai_chat_daily_remaining, skill_run_monthly_remaining)
  VALUES (NEW.id, 5, 10)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user_credits();

-- ── 5. RPC: atomic_deduct_credits ────────────────────────────
-- Atomically deduct credits and write a transaction log row.
-- Returns 'ok', 'insufficient', or 'unlimited'.
CREATE OR REPLACE FUNCTION atomic_deduct_credits(
  p_user_id       UUID,
  p_pool          TEXT,    -- 'ai_chat_daily' | 'skill_run_monthly'
  p_amount        INT,
  p_operation_id  TEXT,
  p_plan_id       TEXT,
  p_metadata      JSONB DEFAULT NULL
)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_before INT;
  v_after  INT;
BEGIN
  -- Lock the row for update
  IF p_pool = 'ai_chat_daily' THEN
    SELECT ai_chat_daily_remaining INTO v_before
    FROM user_credits WHERE user_id = p_user_id FOR UPDATE;

    IF v_before < p_amount THEN
      RETURN 'insufficient';
    END IF;

    v_after := v_before - p_amount;

    UPDATE user_credits
    SET ai_chat_daily_remaining = v_after,
        lifetime_ai_messages_sent = lifetime_ai_messages_sent + 1
    WHERE user_id = p_user_id;

  ELSIF p_pool = 'skill_run_monthly' THEN
    SELECT skill_run_monthly_remaining INTO v_before
    FROM user_credits WHERE user_id = p_user_id FOR UPDATE;

    -- -1 means unlimited (Agency plan)
    IF v_before = -1 THEN
      UPDATE user_credits
      SET lifetime_skill_runs = lifetime_skill_runs + 1
      WHERE user_id = p_user_id;
      RETURN 'unlimited';
    END IF;

    IF v_before < p_amount THEN
      RETURN 'insufficient';
    END IF;

    v_after := v_before - p_amount;

    UPDATE user_credits
    SET skill_run_monthly_remaining = v_after,
        lifetime_skill_runs = lifetime_skill_runs + 1
    WHERE user_id = p_user_id;
  ELSE
    RETURN 'invalid_pool';
  END IF;

  -- Write immutable transaction log
  INSERT INTO credit_transactions
    (user_id, transaction_type, credit_pool, operation_id, credits_delta, credits_before, credits_after, plan_id_at_time, metadata)
  VALUES
    (p_user_id, 'deduct', p_pool, p_operation_id, -p_amount, v_before, v_after, p_plan_id, p_metadata);

  RETURN 'ok';
END;
$$;

-- ── 6. RPC: reset_daily_credits ──────────────────────────────
CREATE OR REPLACE FUNCTION reset_daily_credits(p_user_id UUID, p_new_limit INT, p_plan_id TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_before INT;
BEGIN
  SELECT ai_chat_daily_remaining INTO v_before FROM user_credits WHERE user_id = p_user_id;

  UPDATE user_credits
  SET ai_chat_daily_remaining = p_new_limit,
      ai_chat_daily_last_reset = now()
  WHERE user_id = p_user_id;

  INSERT INTO credit_transactions
    (user_id, transaction_type, credit_pool, operation_id, credits_delta, credits_before, credits_after, plan_id_at_time)
  VALUES
    (p_user_id, 'reset', 'ai_chat_daily', 'daily_reset', p_new_limit - COALESCE(v_before, 0), COALESCE(v_before, 0), p_new_limit, p_plan_id);
END;
$$;

-- ── 7. RPC: reset_monthly_skill_credits ──────────────────────
CREATE OR REPLACE FUNCTION reset_monthly_skill_credits(p_user_id UUID, p_new_limit INT, p_plan_id TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_before INT;
BEGIN
  SELECT skill_run_monthly_remaining INTO v_before FROM user_credits WHERE user_id = p_user_id;

  UPDATE user_credits
  SET skill_run_monthly_remaining = p_new_limit,
      skill_run_monthly_last_reset = now()
  WHERE user_id = p_user_id;

  INSERT INTO credit_transactions
    (user_id, transaction_type, credit_pool, operation_id, credits_delta, credits_before, credits_after, plan_id_at_time)
  VALUES
    (p_user_id, 'reset', 'skill_run_monthly', 'monthly_reset', p_new_limit - COALESCE(v_before, 0), COALESCE(v_before, 0), p_new_limit, p_plan_id);
END;
$$;
