-- ============================================================
-- ZieAds — Add Onboarding Profile Columns Migration
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goals TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_tools TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_volume TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS platforms_in_focus TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS challenge TEXT;
