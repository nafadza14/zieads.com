-- ZieAds v0.3 Database Schema Additions
-- Run this in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/szmjklqrqggqvvorxynv/sql

-- ─── 1. Connected Accounts ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS connected_accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform            TEXT NOT NULL, -- instagram, tiktok, linkedin, x, meta_ads, google_ads, tiktok_ads, linkedin_ads
  platform_account_id TEXT NOT NULL,
  account_handle      TEXT NOT NULL,
  access_token        TEXT,
  refresh_token       TEXT,
  token_expires_at    TIMESTAMPTZ,
  scopes              TEXT[] DEFAULT '{}',
  connection_method   TEXT NOT NULL, -- oauth, csv_upload, chrome_extension, api_native
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  connected_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_at      TIMESTAMPTZ,
  sync_status         TEXT,
  sync_error_message  TEXT,
  metadata            JSONB DEFAULT '{}',
  UNIQUE (user_id, platform, platform_account_id)
);

CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_id ON connected_accounts(user_id);

-- ─── 2. Social Posts ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_posts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform          TEXT NOT NULL,
  platform_post_id  TEXT NOT NULL,
  post_url          TEXT,
  content_text      TEXT,
  media_type        TEXT, -- image, video, carousel, reel, short, text_only
  media_urls        TEXT[] DEFAULT '{}',
  posted_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_metrics       JSONB DEFAULT '{}',
  fetched_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, platform_post_id)
);

CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_posted_at ON social_posts(posted_at DESC);

-- ─── 3. Metric Snapshots (Time-Series) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS metric_snapshots (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id                   UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  account_id                UUID REFERENCES connected_accounts(id) ON DELETE CASCADE,
  user_id                   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  captured_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  likes                     INT DEFAULT 0,
  comments                  INT DEFAULT 0,
  shares                    INT DEFAULT 0,
  saves                     INT DEFAULT 0,
  impressions               INT DEFAULT 0,
  reach                     INT DEFAULT 0,
  video_views               INT DEFAULT 0,
  engagement_rate           DECIMAL DEFAULT 0.0,
  follower_count_at_capture INT DEFAULT 0,
  custom_metrics            JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_metric_snapshots_post_captured ON metric_snapshots(post_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_account_captured ON metric_snapshots(account_id, captured_at DESC);

-- ─── 4. Ad Data ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_data (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id        UUID REFERENCES connected_accounts(id) ON DELETE CASCADE,
  platform          TEXT NOT NULL, -- meta_ads, google_ads, tiktok_ads, linkedin_ads
  campaign_id       TEXT,
  campaign_name     TEXT,
  ad_set_id         TEXT,
  ad_set_name       TEXT,
  ad_id             TEXT,
  ad_name           TEXT,
  date_range_start  DATE NOT NULL,
  date_range_end    DATE NOT NULL,
  impressions       BIGINT DEFAULT 0,
  clicks            INT DEFAULT 0,
  spend_usd         DECIMAL DEFAULT 0.0,
  conversions       INT DEFAULT 0,
  revenue_usd       DECIMAL DEFAULT 0.0,
  ctr               DECIMAL DEFAULT 0.0,
  cpc               DECIMAL DEFAULT 0.0,
  cpm               DECIMAL DEFAULT 0.0,
  roas              DECIMAL DEFAULT 0.0,
  data_source       TEXT NOT NULL, -- csv_upload, chrome_extension, api_native
  uploaded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_row           JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_ad_data_user_start ON ad_data(user_id, date_range_start DESC);
CREATE INDEX IF NOT EXISTS idx_ad_data_campaign ON ad_data(user_id, platform, campaign_id);

-- ─── 5. Daily Briefings ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_briefings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  briefing_date       DATE NOT NULL,
  generated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_via_email BOOLEAN NOT NULL DEFAULT FALSE,
  email_delivered_at  TIMESTAMPTZ,
  opened_at           TIMESTAMPTZ,
  headline            TEXT NOT NULL,
  wins                JSONB DEFAULT '[]',
  concerns            JSONB DEFAULT '[]',
  today_actions       JSONB DEFAULT '[]',
  suggested_deep_dives JSONB DEFAULT '[]',
  raw_ai_response     JSONB DEFAULT '{}',
  model_used          TEXT,
  input_token_count   INT DEFAULT 0,
  output_token_count  INT DEFAULT 0,
  generation_cost_usd DECIMAL DEFAULT 0.0,
  UNIQUE (user_id, briefing_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_briefings_user_date ON daily_briefings(user_id, briefing_date DESC);

-- ─── 6. Content Recommendations ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_recommendations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_starting         DATE NOT NULL,
  generated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  platform              TEXT NOT NULL,
  topic                 TEXT NOT NULL,
  format_recommendation TEXT NOT NULL,
  caption_draft         TEXT NOT NULL,
  optimal_post_time     TIMESTAMPTZ,
  visual_brief          TEXT NOT NULL,
  reasoning             TEXT,
  user_action           TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, modified, published
  user_feedback         TEXT,
  performance_actual    JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_content_recs_user_week ON content_recommendations(user_id, week_starting DESC);

-- ─── 7. Tracked Competitors ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tracked_competitors (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competitor_url        TEXT NOT NULL,
  competitor_handle     TEXT,
  competitor_name       TEXT NOT NULL,
  added_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  last_audited_at       TIMESTAMPTZ,
  audit_frequency_days  INT DEFAULT 7,
  latest_audit_score    INT,
  audit_history         JSONB DEFAULT '[]',
  UNIQUE (user_id, competitor_url)
);

CREATE INDEX IF NOT EXISTS idx_tracked_competitors_user ON tracked_competitors(user_id);

-- ─── 8. Anomaly Alerts ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS anomaly_alerts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id          UUID REFERENCES connected_accounts(id) ON DELETE CASCADE,
  alert_type          TEXT NOT NULL, -- engagement_drop, follower_loss, roas_drop, sentiment_shift, competitor_move, new_viral_post
  severity            TEXT NOT NULL, -- low, medium, high, critical
  triggered_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metric_name         TEXT,
  current_value       DECIMAL,
  baseline_value      DECIMAL,
  pct_change          DECIMAL,
  message             TEXT NOT NULL,
  suggested_action    TEXT,
  suggested_deep_dive TEXT,
  acknowledged_at     TIMESTAMPTZ,
  email_sent          BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_anomaly_alerts_active ON anomaly_alerts(user_id) WHERE acknowledged_at IS NULL;

-- ─── 9. Brand Voice Profiles ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand_voice_profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_summary           TEXT NOT NULL,
  tone_descriptors        TEXT[] DEFAULT '{}',
  common_phrases          TEXT[] DEFAULT '{}',
  vocabulary_level        TEXT,
  emoji_usage_pattern     JSONB DEFAULT '{}',
  hashtag_patterns        TEXT[] DEFAULT '{}',
  avg_post_length         INT DEFAULT 0,
  top_performing_formats  JSONB DEFAULT '[]',
  last_refreshed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  refresh_count           INT DEFAULT 0,
  raw_analysis            JSONB DEFAULT '{}'
);

-- ─── 10. Credit Events (V3 Workflows) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS v3_credit_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type        TEXT NOT NULL, -- daily_briefing, content_recommendation, competitor_audit, anomaly_check, brand_voice_refresh, deep_dive_v03_trigger
  credits_consumed  INT DEFAULT 0,
  cost_usd_actual   DECIMAL DEFAULT 0.0,
  model_used        TEXT,
  occurred_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata          JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_v3_credit_events_user ON v3_credit_events(user_id, occurred_at DESC);

-- ─── 11. Subscription Tiers (V3 Plans) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS v3_subscription_tiers (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tier_name               TEXT NOT NULL, -- free, solo, pro, studio, legacy_v02
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  billing_cycle           TEXT DEFAULT 'monthly',
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  status                  TEXT, -- active, trialing, past_due, canceled, incomplete
  is_legacy_grandfathered BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v3_subs_user ON v3_subscription_tiers(user_id);

-- ─── Row Level Security (RLS) Policies ────────────────────────────────────────
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE v3_credit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE v3_subscription_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_connected_accounts" ON connected_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_social_posts" ON social_posts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_metric_snapshots" ON metric_snapshots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_ad_data" ON ad_data FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_daily_briefings" ON daily_briefings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_content_recs" ON content_recommendations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_tracked_competitors" ON tracked_competitors FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_anomaly_alerts" ON anomaly_alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_brand_voice" ON brand_voice_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "users_own_v3_credit_events" ON v3_credit_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_v3_subscription" ON v3_subscription_tiers FOR ALL USING (auth.uid() = user_id);
