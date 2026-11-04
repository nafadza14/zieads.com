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
