-- ZieAds: brand profile used as knowledge by Zie (AI Agent), the AI Analyst and content tools
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS brand_profile JSONB DEFAULT '{}'::jsonb;
