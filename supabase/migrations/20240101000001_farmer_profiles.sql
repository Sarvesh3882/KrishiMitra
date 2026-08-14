-- Migration: farmer_profiles table
-- Creates the farmer profile table, updated_at trigger, RLS, and policies

-- ============================================================
-- Table
-- ============================================================
CREATE TABLE IF NOT EXISTS farmer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name text,
  phone_number text,
  state text,
  district text,
  taluka text,
  village text,
  latitude double precision,
  longitude double precision,
  enterprise_type text,
  primary_crop text,
  preferred_language text NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi', 'mr')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- updated_at trigger (reusable across tables)
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER farmer_profiles_updated_at
  BEFORE UPDATE ON farmer_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE farmer_profiles ENABLE ROW LEVEL SECURITY;

-- Each farmer can only read their own profile
CREATE POLICY "farmer_profiles_select_own" ON farmer_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Each farmer can only insert their own profile
CREATE POLICY "farmer_profiles_insert_own" ON farmer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Each farmer can only update their own profile
CREATE POLICY "farmer_profiles_update_own" ON farmer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Each farmer can only delete their own profile
CREATE POLICY "farmer_profiles_delete_own" ON farmer_profiles
  FOR DELETE USING (auth.uid() = user_id);
