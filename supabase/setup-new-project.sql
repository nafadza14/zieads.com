-- ============================================================
-- ZieAds: setup database untuk project Supabase BARU
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run
-- Gabungan semua migration project, urut sesuai tanggal dibuat.
-- ============================================================


-- >>>>>>>>>>>>>>>> supabase/migration.sql
-- ZieAds Supabase Database Schema
-- Run this in Supabase Dashboard > SQL Editor

-- ─── Profiles (user business context from onboarding) ─────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  business_type TEXT,
  primary_goal TEXT,
  monthly_budget TEXT,
  platforms TEXT[] DEFAULT '{}',
  primary_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ─── Audits (full audit reports + quick scans) ────────────────
CREATE TABLE IF NOT EXISTS audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  business_name TEXT,
  audit_type TEXT NOT NULL DEFAULT 'full',  -- 'full' | 'quick'
  overall_score INT DEFAULT 0,
  grade TEXT DEFAULT 'F',
  dimensions JSONB DEFAULT '{}',
  findings JSONB DEFAULT '[]',
  agent_results JSONB DEFAULT '[]',
  report JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own audits" ON audits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own audits" ON audits FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow server (service role) to insert for any user: service role bypasses RLS automatically.

-- ─── Skill Results (individual skill executions) ──────────────
CREATE TABLE IF NOT EXISTS skill_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  url TEXT NOT NULL,
  result JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE skill_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own skill results" ON skill_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skill results" ON skill_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── Indexes for performance ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audits_user_id ON audits(user_id);
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skill_results_user_id ON skill_results(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_results_created_at ON skill_results(created_at DESC);

-- ─── Auto-create profile on signup (trigger) ──────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to be idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- >>>>>>>>>>>>>>>> sql/agent-tables.sql
-- ZieAds AI Agent Chat Tables
-- Run this in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/szmjklqrqggqvvorxynv/sql

-- ─── Agent Conversations ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'New conversation',
  context_url TEXT,                          -- the business URL loaded as context
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agent_conversations_user_id_idx ON agent_conversations(user_id);

-- ─── Agent Messages ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agent_messages_conversation_id_idx ON agent_messages(conversation_id);
CREATE INDEX IF NOT EXISTS agent_messages_user_id_idx ON agent_messages(user_id);

-- ─── Agent Usage (for rate limiting) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_usage (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month      TEXT NOT NULL,  -- e.g. "2026-04"
  count      INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, month)
);

CREATE INDEX IF NOT EXISTS agent_usage_user_id_idx ON agent_usage(user_id);

-- ─── Row-Level Security ───────────────────────────────────────────────────────
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_usage ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations / messages / usage
CREATE POLICY "users_own_conversations" ON agent_conversations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_messages" ON agent_messages
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_usage" ON agent_usage
  FOR ALL USING (auth.uid() = user_id);


-- >>>>>>>>>>>>>>>> supabase/migrations/20260609_credit_system.sql
-- ─────────────────────────────────────────────────────────────
-- ZieAds Credit System - Supabase Migration
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


-- >>>>>>>>>>>>>>>> supabase/migrations/20260610_superadmin.sql
-- ─────────────────────────────────────────────────────────────
-- ZieAds Superadmin Dashboard - Schema Migration
-- Created: 2026-06-10
-- ─────────────────────────────────────────────────────────────

-- ── 1. superadmin_users ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS superadmin_users (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 VARCHAR(255) UNIQUE NOT NULL,
  name                  VARCHAR(255) NOT NULL,
  role                  TEXT         NOT NULL CHECK (role IN ('superadmin', 'admin', 'support')),
  password_hash         TEXT         NOT NULL,
  totp_secret           TEXT         DEFAULT NULL,
  totp_enabled          BOOLEAN      DEFAULT FALSE,
  current_session_token TEXT         DEFAULT NULL,
  session_expires_at    TIMESTAMPTZ  DEFAULT NULL,
  last_activity_at      TIMESTAMPTZ  DEFAULT NULL,
  last_login_at         TIMESTAMPTZ  DEFAULT NULL,
  last_login_ip         INET         DEFAULT NULL,
  is_active             BOOLEAN      DEFAULT TRUE,
  created_at            TIMESTAMPTZ  DEFAULT now()
);

-- Seed default superadmin: admin@zieads.com / asikasikjos14
INSERT INTO superadmin_users (email, name, role, password_hash)
VALUES (
  'admin@zieads.com',
  'ZieAds Superadmin',
  'superadmin',
  'a2281ded64db00fd816e1ce9b0942db1:654984746e51aa7500ac0524f5fa1ef62d8562ca1de33c4b921100e2c6e267ec0d2a66c5d6587e2256f43324cd00125f12c60703e09aca0ba5dae960736de15d'
) ON CONFLICT (email) DO NOTHING;

-- ── 2. superadmin_audit_log ──────────────────────────────────
CREATE TABLE IF NOT EXISTS superadmin_audit_log (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  superadmin_id     UUID         REFERENCES superadmin_users(id) ON DELETE SET NULL,
  superadmin_email  VARCHAR(255) NOT NULL,
  action            VARCHAR(100) NOT NULL, -- e.g. user.plan_changed, api_key.rotated
  entity_type       VARCHAR(50)  NOT NULL, -- e.g. user, api_key, credit, system
  entity_id         TEXT         DEFAULT NULL,
  old_value         JSONB        DEFAULT NULL,
  new_value         JSONB        DEFAULT NULL,
  ip_address        INET         NOT NULL,
  created_at        TIMESTAMPTZ  DEFAULT now()
);

-- Index for timeline queries
CREATE INDEX IF NOT EXISTS idx_superadmin_audit_log_created_at
  ON superadmin_audit_log(created_at DESC);

-- Trigger to make the audit log strictly immutable
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Modification or deletion of audit logs is strictly prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_modification ON superadmin_audit_log;
CREATE TRIGGER trg_prevent_audit_log_modification
  BEFORE UPDATE OR DELETE ON superadmin_audit_log
  FOR EACH ROW EXECUTE PROCEDURE prevent_audit_log_modification();

-- ── 3. api_keys ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name        VARCHAR(100) NOT NULL,
  display_name        VARCHAR(100) NOT NULL,
  key_value_encrypted TEXT         NOT NULL,
  key_preview         VARCHAR(20)  NOT NULL,
  environment         TEXT         NOT NULL CHECK (environment IN ('production', 'staging', 'development')),
  is_active           BOOLEAN      DEFAULT TRUE,
  rotated_at          TIMESTAMPTZ  DEFAULT NULL,
  expires_at          TIMESTAMPTZ  DEFAULT NULL,
  created_at          TIMESTAMPTZ  DEFAULT now(),
  created_by          UUID         REFERENCES superadmin_users(id) ON DELETE SET NULL,
  notes               TEXT         DEFAULT NULL
);

-- ── 4. api_usage_logs ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name       VARCHAR(100)  NOT NULL,
  user_id            UUID          DEFAULT NULL, -- references auth.users(id) (handled dynamically on server)
  operation_id       VARCHAR(100)  DEFAULT NULL,
  model              VARCHAR(50)   DEFAULT NULL,
  input_tokens       INT           DEFAULT NULL,
  output_tokens      INT           DEFAULT NULL,
  cache_read_tokens  INT           DEFAULT NULL,
  cache_write_tokens INT           DEFAULT NULL,
  cost_usd           DECIMAL(10,6) DEFAULT NULL,
  latency_ms         INT           DEFAULT NULL,
  status             TEXT          NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
  error_code         VARCHAR(100)  DEFAULT NULL,
  created_at         TIMESTAMPTZ   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at
  ON api_usage_logs(created_at DESC);

-- ── 5. system_alerts ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_alerts (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type  VARCHAR(100) NOT NULL,
  severity    TEXT         NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title       VARCHAR(255) NOT NULL,
  body        TEXT         NOT NULL,
  entity_type VARCHAR(50)  DEFAULT NULL,
  entity_id   TEXT         DEFAULT NULL,
  is_resolved BOOLEAN      DEFAULT FALSE,
  resolved_by UUID         REFERENCES superadmin_users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ  DEFAULT NULL,
  created_at  TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved_created
  ON system_alerts(is_resolved, created_at DESC);

-- ── 6. user_notes ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_notes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL, -- references auth.users(id)
  written_by UUID        REFERENCES superadmin_users(id) ON DELETE SET NULL,
  note       TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_notes_user_created
  ON user_notes(user_id, created_at DESC);


-- >>>>>>>>>>>>>>>> sql/v3-schema.sql
-- ZieAds v0.3 Database Schema Additions
-- Run this in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/szmjklqrqggqvvorxynv/sql

-- ─── 1. Connected Accounts ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS connected_accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform            TEXT NOT NULL, -- instagram, tiktok, linkedin, x, meta_ads, google_ads, tiktok_ads, linkedin_ads
  platform_account_id TEXT NOT NULL,
  account_handle      TEXT NOT NULL,
  access_token        TEXT,
  refresh_token       TEXT,
  token_expires_at    TIMESTAMPTZ,
  scopes              TEXT[] DEFAULT '{}',
  connection_method   TEXT NOT NULL, -- oauth, csv_upload, chrome_extension, api_native
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  connected_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_at      TIMESTAMPTZ,
  sync_status         TEXT,
  sync_error_message  TEXT,
  metadata            JSONB DEFAULT '{}',
  UNIQUE (user_id, platform, platform_account_id)
);

CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_id ON connected_accounts(user_id);

-- ─── 2. Social Posts ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_posts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform          TEXT NOT NULL,
  platform_post_id  TEXT NOT NULL,
  post_url          TEXT,
  content_text      TEXT,
  media_type        TEXT, -- image, video, carousel, reel, short, text_only
  media_urls        TEXT[] DEFAULT '{}',
  posted_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_metrics       JSONB DEFAULT '{}',
  fetched_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, platform_post_id)
);

CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_posted_at ON social_posts(posted_at DESC);

-- ─── 3. Metric Snapshots (Time-Series) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS metric_snapshots (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id                   UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  account_id                UUID REFERENCES connected_accounts(id) ON DELETE CASCADE,
  user_id                   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  captured_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  likes                     INT DEFAULT 0,
  comments                  INT DEFAULT 0,
  shares                    INT DEFAULT 0,
  saves                     INT DEFAULT 0,
  impressions               INT DEFAULT 0,
  reach                     INT DEFAULT 0,
  video_views               INT DEFAULT 0,
  engagement_rate           DECIMAL DEFAULT 0.0,
  follower_count_at_capture INT DEFAULT 0,
  custom_metrics            JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_metric_snapshots_post_captured ON metric_snapshots(post_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_account_captured ON metric_snapshots(account_id, captured_at DESC);

-- ─── 4. Ad Data ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_data (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id        UUID REFERENCES connected_accounts(id) ON DELETE CASCADE,
  platform          TEXT NOT NULL, -- meta_ads, google_ads, tiktok_ads, linkedin_ads
  campaign_id       TEXT,
  campaign_name     TEXT,
  ad_set_id         TEXT,
  ad_set_name       TEXT,
  ad_id             TEXT,
  ad_name           TEXT,
  date_range_start  DATE NOT NULL,
  date_range_end    DATE NOT NULL,
  impressions       BIGINT DEFAULT 0,
  clicks            INT DEFAULT 0,
  spend_usd         DECIMAL DEFAULT 0.0,
  conversions       INT DEFAULT 0,
  revenue_usd       DECIMAL DEFAULT 0.0,
  ctr               DECIMAL DEFAULT 0.0,
  cpc               DECIMAL DEFAULT 0.0,
  cpm               DECIMAL DEFAULT 0.0,
  roas              DECIMAL DEFAULT 0.0,
  data_source       TEXT NOT NULL, -- csv_upload, chrome_extension, api_native
  uploaded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_row           JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_ad_data_user_start ON ad_data(user_id, date_range_start DESC);
CREATE INDEX IF NOT EXISTS idx_ad_data_campaign ON ad_data(user_id, platform, campaign_id);

-- ─── 5. Daily Briefings ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_briefings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  briefing_date       DATE NOT NULL,
  generated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_via_email BOOLEAN NOT NULL DEFAULT FALSE,
  email_delivered_at  TIMESTAMPTZ,
  opened_at           TIMESTAMPTZ,
  headline            TEXT NOT NULL,
  wins                JSONB DEFAULT '[]',
  concerns            JSONB DEFAULT '[]',
  today_actions       JSONB DEFAULT '[]',
  suggested_deep_dives JSONB DEFAULT '[]',
  raw_ai_response     JSONB DEFAULT '{}',
  model_used          TEXT,
  input_token_count   INT DEFAULT 0,
  output_token_count  INT DEFAULT 0,
  generation_cost_usd DECIMAL DEFAULT 0.0,
  UNIQUE (user_id, briefing_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_briefings_user_date ON daily_briefings(user_id, briefing_date DESC);

-- ─── 6. Content Recommendations ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_recommendations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_starting         DATE NOT NULL,
  generated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  platform              TEXT NOT NULL,
  topic                 TEXT NOT NULL,
  format_recommendation TEXT NOT NULL,
  caption_draft         TEXT NOT NULL,
  optimal_post_time     TIMESTAMPTZ,
  visual_brief          TEXT NOT NULL,
  reasoning             TEXT,
  user_action           TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, modified, published
  user_feedback         TEXT,
  performance_actual    JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_content_recs_user_week ON content_recommendations(user_id, week_starting DESC);

-- ─── 7. Tracked Competitors ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tracked_competitors (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competitor_url        TEXT NOT NULL,
  competitor_handle     TEXT,
  competitor_name       TEXT NOT NULL,
  added_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  last_audited_at       TIMESTAMPTZ,
  audit_frequency_days  INT DEFAULT 7,
  latest_audit_score    INT,
  audit_history         JSONB DEFAULT '[]',
  UNIQUE (user_id, competitor_url)
);

CREATE INDEX IF NOT EXISTS idx_tracked_competitors_user ON tracked_competitors(user_id);

-- ─── 8. Anomaly Alerts ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS anomaly_alerts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id          UUID REFERENCES connected_accounts(id) ON DELETE CASCADE,
  alert_type          TEXT NOT NULL, -- engagement_drop, follower_loss, roas_drop, sentiment_shift, competitor_move, new_viral_post
  severity            TEXT NOT NULL, -- low, medium, high, critical
  triggered_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metric_name         TEXT,
  current_value       DECIMAL,
  baseline_value      DECIMAL,
  pct_change          DECIMAL,
  message             TEXT NOT NULL,
  suggested_action    TEXT,
  suggested_deep_dive TEXT,
  acknowledged_at     TIMESTAMPTZ,
  email_sent          BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_anomaly_alerts_active ON anomaly_alerts(user_id) WHERE acknowledged_at IS NULL;

-- ─── 9. Brand Voice Profiles ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand_voice_profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_summary           TEXT NOT NULL,
  tone_descriptors        TEXT[] DEFAULT '{}',
  common_phrases          TEXT[] DEFAULT '{}',
  vocabulary_level        TEXT,
  emoji_usage_pattern     JSONB DEFAULT '{}',
  hashtag_patterns        TEXT[] DEFAULT '{}',
  avg_post_length         INT DEFAULT 0,
  top_performing_formats  JSONB DEFAULT '[]',
  last_refreshed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  refresh_count           INT DEFAULT 0,
  raw_analysis            JSONB DEFAULT '{}'
);

-- ─── 10. Credit Events (V3 Workflows) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS v3_credit_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type        TEXT NOT NULL, -- daily_briefing, content_recommendation, competitor_audit, anomaly_check, brand_voice_refresh, deep_dive_v03_trigger
  credits_consumed  INT DEFAULT 0,
  cost_usd_actual   DECIMAL DEFAULT 0.0,
  model_used        TEXT,
  occurred_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata          JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_v3_credit_events_user ON v3_credit_events(user_id, occurred_at DESC);

-- ─── 11. Subscription Tiers (V3 Plans) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS v3_subscription_tiers (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tier_name               TEXT NOT NULL, -- free, solo, pro, studio, legacy_v02
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  billing_cycle           TEXT DEFAULT 'monthly',
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  status                  TEXT, -- active, trialing, past_due, canceled, incomplete
  is_legacy_grandfathered BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v3_subs_user ON v3_subscription_tiers(user_id);

-- ─── Row Level Security (RLS) Policies ────────────────────────────────────────
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE v3_credit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE v3_subscription_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_connected_accounts" ON connected_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_social_posts" ON social_posts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_metric_snapshots" ON metric_snapshots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_ad_data" ON ad_data FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_daily_briefings" ON daily_briefings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_content_recs" ON content_recommendations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_tracked_competitors" ON tracked_competitors FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_anomaly_alerts" ON anomaly_alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_brand_voice" ON brand_voice_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "users_own_v3_credit_events" ON v3_credit_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_v3_subscription" ON v3_subscription_tiers FOR ALL USING (auth.uid() = user_id);


-- >>>>>>>>>>>>>>>> sql/v3-schema-revision-2.sql
-- ZieAds v0.3 Revision 2 Database Schema Additions
-- Run this in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/szmjklqrqggqvvorxynv/sql

-- ─── 1. Scheduled Posts ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status                      TEXT NOT NULL DEFAULT 'draft', -- draft, queued, scheduled, publishing, published, failed, cancelled
  scheduled_for               TIMESTAMPTZ,
  publish_attempted_at        TIMESTAMPTZ,
  published_at                TIMESTAMPTZ,
  publish_method              TEXT NOT NULL DEFAULT 'direct_api', -- direct_api, manual_reminder, draft_only
  target_platforms            JSONB DEFAULT '[]', -- JSON array of {platform, account_id}
  content_text                TEXT,
  media_attachments           JSONB DEFAULT '[]', -- JSON array of media references
  first_comment               TEXT,
  platform_specific_overrides JSONB DEFAULT '{}',
  publish_error               TEXT,
  retry_count                 INT DEFAULT 0,
  is_part_of_queue            BOOLEAN DEFAULT FALSE,
  queue_slot_id               UUID -- links to queue_slots if scheduled via queue
);

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_status ON scheduled_posts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for);

-- ─── 2. Publish Log ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS publish_log (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_post_id   UUID NOT NULL REFERENCES scheduled_posts(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id          UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  platform            TEXT NOT NULL,
  attempted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  outcome             TEXT NOT NULL, -- success, retry_scheduled, failed_final, manual_required
  platform_post_id    TEXT,
  error_code          TEXT,
  error_message       TEXT,
  response_payload    JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_publish_log_user_time ON publish_log(user_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_publish_log_post ON publish_log(scheduled_post_id);

-- ─── 3. Queue Slots ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS queue_slots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id  UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL, -- 0-6 (0=Sunday)
  time_of_day TIME NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_slots_user_account ON queue_slots(user_id, account_id);

-- ─── 4. Media Library ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media_library (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_type           TEXT NOT NULL, -- image, video
  file_url            TEXT NOT NULL,
  file_size_bytes     BIGINT,
  width               INT,
  height              INT,
  duration_seconds    INT,
  mime_type           TEXT,
  original_filename   TEXT,
  folder_name         TEXT,
  tags                TEXT[] DEFAULT '{}',
  uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_library_user ON media_library(user_id);
CREATE INDEX IF NOT EXISTS idx_media_library_folder ON media_library(user_id, folder_name);

-- ─── 5. Comment Inbox ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comment_inbox (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id              UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  platform                TEXT NOT NULL,
  platform_comment_id     TEXT NOT NULL,
  post_id                 UUID REFERENCES social_posts(id) ON DELETE SET NULL,
  commenter_handle        TEXT NOT NULL,
  commenter_display_name  TEXT,
  commenter_avatar_url    TEXT,
  comment_text            TEXT NOT NULL,
  commented_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_reply_to_comment_id  TEXT,
  user_has_replied        BOOLEAN NOT NULL DEFAULT FALSE,
  user_replied_at         TIMESTAMPTZ,
  sentiment               TEXT, -- positive, neutral, negative
  is_archived             BOOLEAN NOT NULL DEFAULT FALSE,
  fetched_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, platform_comment_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_inbox_user_time ON comment_inbox(user_id, commented_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_inbox_replied ON comment_inbox(user_id, user_has_replied);

-- ─── 6. Comment Replies ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comment_replies (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_inbox_id  UUID NOT NULL REFERENCES comment_inbox(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reply_text        TEXT NOT NULL,
  sent_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  platform_reply_id TEXT,
  send_status       TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed
  error_message     TEXT
);

CREATE INDEX IF NOT EXISTS idx_comment_replies_user ON comment_replies(user_id, sent_at DESC);

-- ─── Row Level Security (RLS) Policies ────────────────────────────────────────
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_scheduled_posts" ON scheduled_posts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_publish_log" ON publish_log FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_queue_slots" ON queue_slots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_media_library" ON media_library FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_comment_inbox" ON comment_inbox FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_comment_replies" ON comment_replies FOR ALL USING (auth.uid() = user_id);


-- >>>>>>>>>>>>>>>> sql/v3-onboarding-flag.sql
-- Add has_completed_onboarding flag to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false;


-- >>>>>>>>>>>>>>>> sql/v3-onboarding-data.sql
-- Add onboarding preference fields and tracking columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS goals TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS current_tools TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS account_volume TEXT,
ADD COLUMN IF NOT EXISTS platforms_in_focus TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false;


-- >>>>>>>>>>>>>>>> sql/oauth-social-connections.sql
-- ZieAds OAuth Callback Database Migration Schema
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/szmjklqrqggqvvorxynv/sql

-- 1. OAuth States Table (for CSRF Protection and State-User mapping)
CREATE TABLE IF NOT EXISTS oauth_states (
  state          VARCHAR(255) PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform       VARCHAR(50) NOT NULL,
  code_verifier  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for cleaning up expired states
CREATE INDEX IF NOT EXISTS idx_oauth_states_created_at ON oauth_states(created_at);

-- Enable RLS on oauth_states
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_own_oauth_states ON oauth_states
  FOR ALL USING (auth.uid() = user_id);

-- 2. Social Connections Table
CREATE TABLE IF NOT EXISTS social_connections (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform                VARCHAR(50) NOT NULL, -- 'instagram', 'tiktok', 'linkedin'
  platform_user_id        VARCHAR(255) NOT NULL,
  platform_username       VARCHAR(255),
  platform_display_name   VARCHAR(255),
  platform_avatar_url     TEXT,
  platform_account_type   VARCHAR(50),
  access_token            TEXT NOT NULL, -- Encrypted AES-256
  refresh_token           TEXT,          -- Encrypted AES-256
  token_expires_at        TIMESTAMPTZ,
  scopes_granted          TEXT,          -- comma-separated list of scopes
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  connected_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_refreshed_at       TIMESTAMPTZ,
  last_synced_at          TIMESTAMPTZ,
  metadata                JSONB DEFAULT '{}'::jsonb,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, platform)
);

-- Indexes for social_connections
CREATE INDEX IF NOT EXISTS idx_social_connections_user_id ON social_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_platform_active ON social_connections(platform, is_active);

-- Enable RLS on social_connections
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_own_social_connections ON social_connections
  FOR ALL USING (auth.uid() = user_id);


-- >>>>>>>>>>>>>>>> supabase/migrations/20260708_v03_feature_tables.sql
-- ZieAds v0.3 Foundation Migrations
-- Run this in Supabase Dashboard > SQL Editor or via CLI

-- 1. Scheduled Posts Table (Composer drafts & scheduled posts)
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_account_id TEXT NOT NULL,
  caption TEXT,
  media_urls JSONB DEFAULT '[]'::jsonb,
  media_type TEXT,
  hashtags TEXT[],
  scheduled_for TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  platform_media_id TEXT,
  platform_permalink TEXT,
  container_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_due ON scheduled_posts(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user ON scheduled_posts(user_id, status);
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY scheduled_posts_owner ON scheduled_posts 
  FOR ALL 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- 2. Media Library Table (Vercel Blob uploaded media)
CREATE TABLE IF NOT EXISTS media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blob_url TEXT NOT NULL,
  blob_pathname TEXT NOT NULL,
  file_name TEXT,
  file_size_bytes BIGINT,
  mime_type TEXT,
  width INT,
  height INT,
  duration_seconds NUMERIC,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_library_user ON media_library(user_id, uploaded_at DESC);
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY media_library_owner ON media_library 
  FOR ALL 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- 3. Post Insights Cache Table (Cached Instagram Insights per post)
CREATE TABLE IF NOT EXISTS post_insights_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_media_id TEXT NOT NULL,
  impressions BIGINT,
  reach BIGINT,
  engagement BIGINT,
  likes BIGINT,
  comments_count BIGINT,
  saves BIGINT,
  shares BIGINT,
  video_views BIGINT,
  plays BIGINT,
  raw_response JSONB,
  post_published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_post_insights_unique ON post_insights_cache(user_id, platform, platform_media_id);
CREATE INDEX IF NOT EXISTS idx_post_insights_user ON post_insights_cache(user_id, fetched_at DESC);
ALTER TABLE post_insights_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY post_insights_owner ON post_insights_cache 
  FOR ALL 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- 4. Account Insights Daily Table (Daily snapshot of account metrics)
CREATE TABLE IF NOT EXISTS account_insights_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_account_id TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  followers_count BIGINT,
  following_count BIGINT,
  media_count BIGINT,
  impressions_daily BIGINT,
  reach_daily BIGINT,
  profile_views_daily BIGINT,
  website_clicks_daily BIGINT,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_account_insights_unique ON account_insights_daily(user_id, platform, snapshot_date);
ALTER TABLE account_insights_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY account_insights_owner ON account_insights_daily 
  FOR ALL 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- 5. Comments Inbox Table (Unified inbox of comments from all platforms)
CREATE TABLE IF NOT EXISTS comments_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_comment_id TEXT NOT NULL,
  platform_media_id TEXT NOT NULL,
  parent_comment_id TEXT,
  author_username TEXT,
  author_platform_id TEXT,
  text TEXT,
  sentiment TEXT,
  sentiment_confidence NUMERIC,
  status TEXT DEFAULT 'unread',
  replied_at TIMESTAMPTZ,
  reply_text TEXT,
  reply_platform_id TEXT,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_comments_unique ON comments_inbox(user_id, platform, platform_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments_inbox(user_id, status, posted_at DESC);
ALTER TABLE comments_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY comments_inbox_owner ON comments_inbox 
  FOR ALL 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- 6. AI Briefings Table (Persisted daily briefings)
CREATE TABLE IF NOT EXISTS ai_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  briefing_date DATE NOT NULL,
  summary TEXT,
  highlights JSONB,
  recommended_actions JSONB,
  anomalies_detected JSONB,
  raw_data_snapshot JSONB,
  model_used TEXT,
  input_tokens INT,
  output_tokens INT,
  generated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_briefings_unique ON ai_briefings(user_id, briefing_date);
ALTER TABLE ai_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_briefings_owner ON ai_briefings 
  FOR ALL 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- 7. Competitors Table (Real user-added competitors)
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website_url TEXT,
  instagram_username TEXT,
  last_audited_at TIMESTAMPTZ,
  audit_score INT,
  audit_report JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_competitors_user ON competitors(user_id);
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY competitors_owner ON competitors 
  FOR ALL 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- >>>>>>>>>>>>>>>> supabase/migrations/20260710_repair_v03_tables.sql
-- ============================================================
-- ZieAds v0.3 - Repair Database Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- This drops the old conflicting tables and recreates them
-- with the correct schemas required for ZieAds v0.3
-- ============================================================

-- 1. Clean up old conflicting tables (with cascade to clean indexes/RLS policies)
DROP TABLE IF EXISTS media_library CASCADE;
DROP TABLE IF EXISTS scheduled_posts CASCADE;
DROP TABLE IF EXISTS post_insights_cache CASCADE;
DROP TABLE IF EXISTS account_insights_daily CASCADE;
DROP TABLE IF EXISTS comments_inbox CASCADE;
DROP TABLE IF EXISTS ai_briefings CASCADE;
DROP TABLE IF EXISTS competitors CASCADE;

-- 2. Recreate Scheduled Posts Table
CREATE TABLE scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_account_id TEXT NOT NULL,
  caption TEXT,
  media_urls JSONB DEFAULT '[]'::jsonb,
  media_type TEXT,
  hashtags TEXT[],
  scheduled_for TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  platform_media_id TEXT,
  platform_permalink TEXT,
  container_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scheduled_posts_due ON scheduled_posts(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_scheduled_posts_user ON scheduled_posts(user_id, status);
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY scheduled_posts_owner ON scheduled_posts 
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 3. Recreate Media Library Table (Vercel Blob uploaded media)
CREATE TABLE media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blob_url TEXT NOT NULL,
  blob_pathname TEXT NOT NULL,
  file_name TEXT,
  file_size_bytes BIGINT,
  mime_type TEXT,
  width INT,
  height INT,
  duration_seconds NUMERIC,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_media_library_user ON media_library(user_id, uploaded_at DESC);
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY media_library_owner ON media_library 
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 4. Recreate Post Insights Cache Table
CREATE TABLE post_insights_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_media_id TEXT NOT NULL,
  impressions BIGINT,
  reach BIGINT,
  engagement BIGINT,
  likes BIGINT,
  comments_count BIGINT,
  saves BIGINT,
  shares BIGINT,
  video_views BIGINT,
  plays BIGINT,
  raw_response JSONB,
  post_published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_post_insights_unique ON post_insights_cache(user_id, platform, platform_media_id);
CREATE INDEX idx_post_insights_user ON post_insights_cache(user_id, fetched_at DESC);
ALTER TABLE post_insights_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY post_insights_owner ON post_insights_cache 
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 5. Recreate Account Insights Daily Table
CREATE TABLE account_insights_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_account_id TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  followers_count BIGINT,
  following_count BIGINT,
  media_count BIGINT,
  impressions_daily BIGINT,
  reach_daily BIGINT,
  profile_views_daily BIGINT,
  website_clicks_daily BIGINT,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_account_insights_unique ON account_insights_daily(user_id, platform, snapshot_date);
ALTER TABLE account_insights_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY account_insights_owner ON account_insights_daily 
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 6. Recreate Comments Inbox Table (Unified inbox of comments)
CREATE TABLE comments_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_comment_id TEXT NOT NULL,
  platform_media_id TEXT NOT NULL,
  parent_comment_id TEXT,
  author_username TEXT,
  author_platform_id TEXT,
  text TEXT,
  sentiment TEXT,
  sentiment_confidence NUMERIC,
  status TEXT DEFAULT 'unread',
  replied_at TIMESTAMPTZ,
  reply_text TEXT,
  reply_platform_id TEXT,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_comments_unique ON comments_inbox(user_id, platform, platform_comment_id);
CREATE INDEX idx_comments_status ON comments_inbox(user_id, status, posted_at DESC);
ALTER TABLE comments_inbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY comments_inbox_owner ON comments_inbox 
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 7. Recreate AI Briefings Table (Persisted daily briefings)
CREATE TABLE ai_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  briefing_date DATE NOT NULL,
  summary TEXT,
  highlights JSONB,
  recommended_actions JSONB,
  anomalies_detected JSONB,
  raw_data_snapshot JSONB,
  model_used TEXT,
  input_tokens INT,
  output_tokens INT,
  generated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_briefings_unique ON ai_briefings(user_id, briefing_date);
ALTER TABLE ai_briefings ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_briefings_owner ON ai_briefings 
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 8. Recreate Competitors Table (Real user-added competitors)
CREATE TABLE competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website_url TEXT,
  instagram_username TEXT,
  last_audited_at TIMESTAMPTZ,
  audit_score INT,
  audit_report JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_competitors_user ON competitors(user_id);
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY competitors_owner ON competitors 
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 9. Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';


-- >>>>>>>>>>>>>>>> supabase/migrations/20260711_inbox_performance_indexes.sql
-- Ensure indexes exist for common query patterns
CREATE INDEX IF NOT EXISTS idx_comments_user_status_posted ON comments_inbox(user_id, status, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_user_sentiment ON comments_inbox(user_id, sentiment, posted_at DESC) WHERE status != 'archived';
CREATE INDEX IF NOT EXISTS idx_comments_user_platform_media ON comments_inbox(user_id, platform, platform_media_id);

-- Ensure unique index prevents duplicate ingestion
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_comments_unique') THEN
    CREATE UNIQUE INDEX idx_comments_unique ON comments_inbox(user_id, platform, platform_comment_id);
  END IF;
END
$$;

-- Add column for tracking last successful sync per user
ALTER TABLE comments_inbox ADD COLUMN IF NOT EXISTS ingestion_source TEXT DEFAULT 'cron_polling';

-- Create sync tracking table for observability
CREATE TABLE IF NOT EXISTS inbox_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  sync_started_at TIMESTAMPTZ DEFAULT now(),
  sync_completed_at TIMESTAMPTZ,
  new_comments_count INT DEFAULT 0,
  error_message TEXT,
  duration_ms INT
);
CREATE INDEX IF NOT EXISTS idx_inbox_sync_log_user ON inbox_sync_log(user_id, sync_started_at DESC);

-- Enable RLS and create policy for ownership check
ALTER TABLE inbox_sync_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS inbox_sync_log_owner ON inbox_sync_log;
CREATE POLICY inbox_sync_log_owner ON inbox_sync_log FOR SELECT USING (user_id = auth.uid());


-- >>>>>>>>>>>>>>>> supabase/migrations/20260809_add_onboarding_profile_columns.sql
-- ============================================================
-- ZieAds - Add Onboarding Profile Columns Migration
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goals TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_tools TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_volume TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS platforms_in_focus TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS challenge TEXT;


-- >>>>>>>>>>>>>>>> supabase/migrations/20261013_brand_profile.sql
-- ZieAds: brand profile used as knowledge by Zie (AI Agent), the AI Analyst and content tools
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS brand_profile JSONB DEFAULT '{}'::jsonb;


-- >>>>>>>>>>>>>>>> supabase/migrations/20261014_competitor_content.sql
-- Competitor Hunt: live content feed (ads + organic posts) per competitor.
-- Safe to run more than once.

ALTER TABLE competitors ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS meta_page_id TEXT;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS tiktok_username TEXT;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS content_synced_at TIMESTAMPTZ;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS content_sync_status JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS competitor_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- where it lives: instagram | facebook | tiktok | linkedin
  platform TEXT NOT NULL,
  -- organic | ad
  kind TEXT NOT NULL,
  -- meta_ads | tiktok_ads | linkedin_ads | instagram | facebook | tiktok | linkedin
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  url TEXT,
  caption TEXT,
  headline TEXT,
  cta TEXT,
  link_url TEXT,
  -- image | video | carousel | text
  media_type TEXT,
  thumbnail_url TEXT,
  media_url TEXT,
  carousel JSONB DEFAULT '[]'::jsonb,
  -- e.g. 9:16, 4:5, 1:1, 1.91:1
  aspect TEXT,
  placements TEXT[] DEFAULT '{}',
  is_active BOOLEAN,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  -- likes, comments, views, shares, impressions_text, variants
  metrics JSONB DEFAULT '{}'::jsonb,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  fetched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (competitor_id, source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_competitor_content_comp ON competitor_content(competitor_id, kind, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_content_user ON competitor_content(user_id);

ALTER TABLE competitor_content ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY competitor_content_owner ON competitor_content
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

NOTIFY pgrst, 'reload schema';


-- >>>>>>>>>>>>>>>> extras (dipakai kode, belum ada di migration)
CREATE OR REPLACE FUNCTION public.increment_agent_usage(p_user_id uuid, p_month text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO agent_usage (user_id, month, count) VALUES (p_user_id, p_month, 1)
  ON CONFLICT (user_id, month) DO UPDATE SET count = agent_usage.count + 1;
$$;

INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- >>>>>>>>>>>>>>>> fix: trigger user baru (schema public eksplisit)
-- Fix: trigger kredit user baru gagal karena nama tabel tanpa schema "public."
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_plan (user_id, plan_id, billing_anchor_day)
  VALUES (NEW.id, 'free', 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_credits (user_id, ai_chat_daily_remaining, skill_run_monthly_remaining)
  VALUES (NEW.id, 5, 10)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
