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
