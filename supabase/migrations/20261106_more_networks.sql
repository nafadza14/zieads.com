-- Threads, Pinterest, YouTube, Bluesky, Mastodon, Telegram and Discord connections.
-- Safe to run more than once. Connections themselves live in social_connections like the others.

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
