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
