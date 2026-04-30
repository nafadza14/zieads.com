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
