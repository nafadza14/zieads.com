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
