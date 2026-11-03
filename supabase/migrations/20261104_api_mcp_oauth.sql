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
