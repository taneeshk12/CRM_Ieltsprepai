-- =====================================================
-- Free Mode Setup for Supabase
-- =====================================================
-- This SQL script creates the app_settings table and
-- sets up the free mode feature for the IELTS app.
--
-- Run this in your Supabase SQL Editor:
-- 1. Go to Supabase Dashboard
-- 2. Click on "SQL Editor"
-- 3. Paste this entire script
-- 4. Click "Run"
-- =====================================================

-- Create app_settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value boolean NOT NULL DEFAULT false,
  description text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create index on setting_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key 
  ON public.app_settings(setting_key);

-- Insert free mode setting (only if it doesn't exist)
INSERT INTO public.app_settings (
  setting_key, 
  setting_value, 
  description
)
VALUES (
  'free_mode', 
  false, 
  'When enabled, users can use the app without credits. No credits will be deducted for any evaluations.'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean setup)
DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Authenticated users can update app settings" ON public.app_settings;

-- Policy: Allow anyone to read app_settings
-- This is needed so the IELTS app can check free mode status
CREATE POLICY "Anyone can read app settings"
  ON public.app_settings
  FOR SELECT
  USING (true);

-- Policy: Allow authenticated users to update app_settings
-- This is for the admin panel to toggle free mode
CREATE POLICY "Authenticated users can update app settings"
  ON public.app_settings
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Optional: Add a function to update the timestamp automatically
CREATE OR REPLACE FUNCTION update_app_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update timestamp
DROP TRIGGER IF EXISTS app_settings_updated_at ON public.app_settings;
CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_app_settings_timestamp();

-- =====================================================
-- Verification Queries
-- =====================================================
-- Run these to verify everything is set up correctly:

-- Check if table was created
SELECT 
  'Table exists' as status,
  COUNT(*) as row_count 
FROM public.app_settings;

-- Check free_mode setting
SELECT 
  setting_key,
  setting_value,
  description,
  created_at,
  updated_at
FROM public.app_settings 
WHERE setting_key = 'free_mode';

-- =====================================================
-- Setup Complete!
-- =====================================================
-- You should see:
-- - Table exists with 1 row
-- - free_mode setting with value 'false'
-- 
-- Next steps:
-- 1. Go to your admin app
-- 2. Navigate to /dashboard
-- 3. Use the Free Mode Toggle to enable/disable free mode
-- =====================================================
