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
