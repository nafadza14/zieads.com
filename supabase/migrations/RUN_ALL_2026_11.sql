-- ZieAds: every database change from November 2026 in one file.
-- Safe to run more than once (IF NOT EXISTS everywhere). Paste all of it in Supabase, SQL Editor, Run.
-- Covers: 20261103_spec_update, 20261104_api_mcp_oauth, 20261106_more_networks.

-- ===== 20261103_spec_update =====
-- ============================================================
-- ZieAds spec update (implementasi-update.md, Nov 2026)
-- Safe to run more than once: every statement is idempotent.
-- Run in Supabase > SQL Editor after setup-new-project.sql.
-- ============================================================

-- ─── 1. User settings (Settings > Notifications, briefing time, checklist) ───
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  briefing_time    TEXT NOT NULL DEFAULT '07:00',
  timezone         TEXT NOT NULL DEFAULT 'Asia/Jakarta',
  briefing_channels JSONB NOT NULL DEFAULT '{"in_app": true, "email": true, "push": false}'::jsonb,
  alert_threshold_pct INT NOT NULL DEFAULT 25,
  unanswered_hours INT NOT NULL DEFAULT 2,
  checklist        JSONB NOT NULL DEFAULT '{}'::jsonb,
  preferences      JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_settings_self" ON public.user_settings;
CREATE POLICY "user_settings_self" ON public.user_settings FOR ALL USING (auth.uid() = user_id);

-- ─── 2. Team members (Settings > Team) ───
CREATE TABLE IF NOT EXISTS public.team_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer', 'client')),
  status      TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'revoked')),
  invited_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, email)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "team_members_owner" ON public.team_members;
CREATE POLICY "team_members_owner" ON public.team_members FOR ALL USING (auth.uid() = owner_id);

-- ─── 3. Agent tasks: every action the agent proposes waits for approval ───
CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL,                -- schedule_post, send_reply, reconnect, review_post, ...
  title        TEXT NOT NULL,
  detail       TEXT,
  payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence     JSONB NOT NULL DEFAULT '[]'::jsonb,  -- links to the post or metric behind the action
  status       TEXT NOT NULL DEFAULT 'pending_approval'
               CHECK (status IN ('pending_approval', 'approved', 'executed', 'failed', 'dismissed')),
  created_by   TEXT NOT NULL DEFAULT 'briefing' CHECK (created_by IN ('briefing', 'chat', 'scheduled', 'mcp', 'guardian')),
  result       JSONB,
  dedupe_key   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at   TIMESTAMPTZ,
  executed_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS agent_tasks_user_status ON public.agent_tasks (user_id, status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS agent_tasks_dedupe ON public.agent_tasks (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agent_tasks_self" ON public.agent_tasks;
CREATE POLICY "agent_tasks_self" ON public.agent_tasks FOR ALL USING (auth.uid() = user_id);

-- ─── 4. Activity log, append only (spec 8.3) ───
CREATE TABLE IF NOT EXISTS public.activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor       TEXT NOT NULL CHECK (actor IN ('user', 'agent', 'mcp', 'guardian', 'system')),
  action      TEXT NOT NULL,
  object_type TEXT,
  object_id   TEXT,
  detail      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activity_log_user_time ON public.activity_log (user_id, created_at DESC);
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activity_log_read_self" ON public.activity_log;
CREATE POLICY "activity_log_read_self" ON public.activity_log FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.prevent_activity_log_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Rows may only disappear together with the user (ON DELETE CASCADE runs as a delete of auth.users)
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'activity_log is append only';
  END IF;
  RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS trg_activity_log_no_update ON public.activity_log;
CREATE TRIGGER trg_activity_log_no_update BEFORE UPDATE ON public.activity_log
  FOR EACH ROW EXECUTE FUNCTION public.prevent_activity_log_change();

-- ─── 5. Connection health (spec 7.9, 7.10) ───
ALTER TABLE public.social_connections ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'live';
ALTER TABLE public.social_connections ADD COLUMN IF NOT EXISTS last_error_code TEXT;
ALTER TABLE public.social_connections ADD COLUMN IF NOT EXISTS last_error_message TEXT;
ALTER TABLE public.social_connections ADD COLUMN IF NOT EXISTS expiry_notified_at TIMESTAMPTZ;
DO $$ BEGIN
  ALTER TABLE public.social_connections ADD CONSTRAINT social_connections_status_chk
    CHECK (status IN ('live', 'needs_reconnect', 'error', 'revoked'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 6. Post lifecycle: approval flow, retries and idempotency (spec 7.4, 8.1) ───
ALTER TABLE public.scheduled_posts ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
ALTER TABLE public.scheduled_posts ADD COLUMN IF NOT EXISTS retry_count INT NOT NULL DEFAULT 0;
ALTER TABLE public.scheduled_posts ADD COLUMN IF NOT EXISTS first_comment TEXT;
ALTER TABLE public.scheduled_posts ADD COLUMN IF NOT EXISTS platform_options JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.scheduled_posts ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS scheduled_posts_idempotency ON public.scheduled_posts (idempotency_key) WHERE idempotency_key IS NOT NULL;

-- ─── 7. Inbox intent (buying signal) and priority (spec 7.7) ───
ALTER TABLE public.comments_inbox ADD COLUMN IF NOT EXISTS intent TEXT;
ALTER TABLE public.comments_inbox ADD COLUMN IF NOT EXISTS priority INT NOT NULL DEFAULT 3;
ALTER TABLE public.comments_inbox ADD COLUMN IF NOT EXISTS reply_draft TEXT;
CREATE INDEX IF NOT EXISTS comments_inbox_priority ON public.comments_inbox (user_id, status, priority, posted_at DESC);

-- ─── 8. Ads metrics: ad_data is the one table for ads, from read-only API or the CSV manual import (spec P0-4) ───
ALTER TABLE public.ad_data ADD COLUMN IF NOT EXISTS import_id UUID;
ALTER TABLE public.ad_data ADD COLUMN IF NOT EXISTS currency TEXT;
CREATE INDEX IF NOT EXISTS ad_data_user_platform_date ON public.ad_data (user_id, platform, date_range_start DESC);

-- ─── 9. MCP and API keys, one key per brand, stored as a hash (spec 8.3, 10) ───
CREATE TABLE IF NOT EXISTS public.mcp_keys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL DEFAULT 'MCP key',
  key_hash     TEXT NOT NULL UNIQUE,
  key_preview  TEXT NOT NULL,
  scopes       TEXT[] NOT NULL DEFAULT ARRAY['read', 'draft']::text[],
  auto_approve TEXT[] NOT NULL DEFAULT '{}'::text[],
  last_used_at TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mcp_keys_user ON public.mcp_keys (user_id);
ALTER TABLE public.mcp_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mcp_keys_self" ON public.mcp_keys;
CREATE POLICY "mcp_keys_self" ON public.mcp_keys FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.mcp_usage (
  user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day      DATE NOT NULL,
  calls    INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
ALTER TABLE public.mcp_usage ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.increment_mcp_usage(p_user_id uuid, p_day date)
RETURNS int LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.mcp_usage (user_id, day, calls) VALUES (p_user_id, p_day, 1)
  ON CONFLICT (user_id, day) DO UPDATE SET calls = public.mcp_usage.calls + 1
  RETURNING calls;
$$;

-- ─── 10. Scheduled agents: recurring tasks the user sets up (spec 7.3) ───
CREATE TABLE IF NOT EXISTS public.scheduled_agents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  prompt      TEXT NOT NULL,
  cadence     TEXT NOT NULL CHECK (cadence IN ('hourly', 'daily', 'weekly')),
  run_at      TEXT NOT NULL DEFAULT '08:00',   -- HH:MM in the user's timezone
  weekday     INT,                              -- 0 Sunday .. 6 Saturday, for weekly
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS scheduled_agents_due ON public.scheduled_agents (is_active, next_run_at);
ALTER TABLE public.scheduled_agents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scheduled_agents_self" ON public.scheduled_agents;
CREATE POLICY "scheduled_agents_self" ON public.scheduled_agents FOR ALL USING (auth.uid() = user_id);

-- ─── 11. Data deletion requests (Meta data deletion callback, spec P0-5) ───
CREATE TABLE IF NOT EXISTS public.data_deletion_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  confirmation_code TEXT NOT NULL UNIQUE,
  platform          TEXT NOT NULL,
  platform_user_id  TEXT,
  user_id           UUID,
  status            TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'completed', 'not_found')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ
);
ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;

-- ===== 20261104_api_mcp_oauth =====
-- ZieAds API and MCP: keys, usage, OAuth for Claude and ChatGPT connectors.
-- Safe to run more than once, and safe to run on a project that never ran 20261103_spec_update.sql.

-- ─── Keys (API keys and OAuth access tokens share one table) ───
CREATE TABLE IF NOT EXISTS public.mcp_keys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL DEFAULT 'MCP key',
  key_hash     TEXT NOT NULL UNIQUE,
  key_preview  TEXT NOT NULL,
  scopes       TEXT[] NOT NULL DEFAULT ARRAY['read', 'draft']::text[],
  auto_approve TEXT[] NOT NULL DEFAULT '{}'::text[],
  last_used_at TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mcp_keys_user ON public.mcp_keys (user_id);
ALTER TABLE public.mcp_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mcp_keys_self" ON public.mcp_keys;
CREATE POLICY "mcp_keys_self" ON public.mcp_keys FOR SELECT USING (auth.uid() = user_id);

-- kind 'key' is a key made in Settings, 'oauth' is an app connected with OAuth (Claude, ChatGPT)
ALTER TABLE public.mcp_keys ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'key';
ALTER TABLE public.mcp_keys ADD COLUMN IF NOT EXISTS oauth_client_id TEXT;
ALTER TABLE public.mcp_keys ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.mcp_keys ADD COLUMN IF NOT EXISTS refresh_hash TEXT;
ALTER TABLE public.mcp_keys ADD COLUMN IF NOT EXISTS refresh_expires_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS mcp_keys_refresh ON public.mcp_keys (refresh_hash) WHERE refresh_hash IS NOT NULL;

-- ─── Daily usage, shared by the REST API and MCP ───
CREATE TABLE IF NOT EXISTS public.mcp_usage (
  user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day      DATE NOT NULL,
  calls    INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
ALTER TABLE public.mcp_usage ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.increment_mcp_usage(p_user_id uuid, p_day date)
RETURNS int LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.mcp_usage (user_id, day, calls) VALUES (p_user_id, p_day, 1)
  ON CONFLICT (user_id, day) DO UPDATE SET calls = public.mcp_usage.calls + 1
  RETURNING calls;
$$;

-- ─── OAuth 2.1 clients (dynamic client registration) and authorization codes ───
CREATE TABLE IF NOT EXISTS public.oauth_clients (
  client_id          TEXT PRIMARY KEY,
  client_secret_hash TEXT,
  client_name        TEXT NOT NULL DEFAULT 'MCP client',
  redirect_uris      TEXT[] NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.oauth_clients ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.oauth_codes (
  code_hash      TEXT PRIMARY KEY,
  client_id      TEXT NOT NULL REFERENCES public.oauth_clients(client_id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redirect_uri   TEXT NOT NULL,
  code_challenge TEXT NOT NULL,
  scopes         TEXT[] NOT NULL,
  expires_at     TIMESTAMPTZ NOT NULL,
  used_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.oauth_codes ENABLE ROW LEVEL SECURITY;

-- ===== 20261106_more_networks =====
-- Threads, Pinterest, YouTube, Bluesky, Mastodon, Telegram and Discord connections.
-- Safe to run more than once. Connections themselves live in social_connections like the others.

-- Connection health columns (also in 20261103_spec_update.sql; repeated so this file works on its own)
ALTER TABLE public.social_connections ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'live';
ALTER TABLE public.social_connections ADD COLUMN IF NOT EXISTS last_error_message TEXT;

-- OAuth state can carry extra data (the Mastodon server a user picked)
ALTER TABLE public.oauth_states ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Mastodon: one ZieAds app per server, registered the first time someone connects from it
CREATE TABLE IF NOT EXISTS public.mastodon_apps (
  instance      TEXT PRIMARY KEY,
  client_id     TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  redirect_uri  TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mastodon_apps ENABLE ROW LEVEL SECURITY;

-- One click connect for Telegram: a code the user sends to the ZieAds bot with Start,
-- then the bot sees which channel or group it was added to
CREATE TABLE IF NOT EXISTS public.telegram_links (
  code        TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tg_user_id  BIGINT,
  status      TEXT NOT NULL DEFAULT 'waiting',  -- waiting, started, connected
  chat_title  TEXT,
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS telegram_links_tg_user ON public.telegram_links (tg_user_id, created_at DESC);
ALTER TABLE public.telegram_links ENABLE ROW LEVEL SECURITY;

-- Bluesky OAuth (AT Protocol): sign in state and sessions, values encrypted by the server
CREATE TABLE IF NOT EXISTS public.bluesky_oauth_store (
  kind       TEXT NOT NULL,   -- state or session
  key        TEXT NOT NULL,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (kind, key)
);
ALTER TABLE public.bluesky_oauth_store ENABLE ROW LEVEL SECURITY;

-- Comments from every network in one table (the Comments page and the Inbox read it)
ALTER TABLE public.comments_inbox ADD COLUMN IF NOT EXISTS intent TEXT;
ALTER TABLE public.comments_inbox ADD COLUMN IF NOT EXISTS priority INT NOT NULL DEFAULT 3;
ALTER TABLE public.comments_inbox ADD COLUMN IF NOT EXISTS reply_draft TEXT;
ALTER TABLE public.comments_inbox ADD COLUMN IF NOT EXISTS ingestion_source TEXT DEFAULT 'cron_polling';
ALTER TABLE public.comments_inbox ADD COLUMN IF NOT EXISTS author_avatar TEXT;
-- Post context and the ids each network needs to reply (Bluesky uri and cid, Telegram chat, YouTube thread)
ALTER TABLE public.comments_inbox ADD COLUMN IF NOT EXISTS meta JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS comments_inbox_post ON public.comments_inbox (user_id, platform, platform_media_id);

-- Refresh the API schema cache so the new columns are visible right away
NOTIFY pgrst, 'reload schema';
