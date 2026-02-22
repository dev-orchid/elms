-- ============================================================
-- 007_profile_banner.sql
-- Add banner_url column to profiles table.
-- Run in Supabase SQL Editor.
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
