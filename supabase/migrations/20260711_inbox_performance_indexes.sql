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
