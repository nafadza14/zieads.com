-- Add onboarding preference fields and tracking columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS goals TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS current_tools TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS account_volume TEXT,
ADD COLUMN IF NOT EXISTS platforms_in_focus TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 1;
