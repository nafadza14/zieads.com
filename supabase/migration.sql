-- ZieAds Supabase Database Schema
-- Run this in Supabase Dashboard > SQL Editor

-- ─── Profiles (user business context from onboarding) ─────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  business_type TEXT,
  primary_goal TEXT,
  monthly_budget TEXT,
  platforms TEXT[] DEFAULT '{}',
  primary_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ─── Audits (full audit reports + quick scans) ────────────────
CREATE TABLE IF NOT EXISTS audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  business_name TEXT,
  audit_type TEXT NOT NULL DEFAULT 'full',  -- 'full' | 'quick'
  overall_score INT DEFAULT 0,
  grade TEXT DEFAULT 'F',
  dimensions JSONB DEFAULT '{}',
  findings JSONB DEFAULT '[]',
  agent_results JSONB DEFAULT '[]',
  report JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own audits" ON audits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own audits" ON audits FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow server (service role) to insert for any user: service role bypasses RLS automatically.

-- ─── Skill Results (individual skill executions) ──────────────
CREATE TABLE IF NOT EXISTS skill_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  url TEXT NOT NULL,
  result JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE skill_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own skill results" ON skill_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skill results" ON skill_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── Indexes for performance ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audits_user_id ON audits(user_id);
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skill_results_user_id ON skill_results(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_results_created_at ON skill_results(created_at DESC);

-- ─── Auto-create profile on signup (trigger) ──────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to be idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
