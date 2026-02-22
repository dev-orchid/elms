-- ============================================================
-- ELMS — 004_storage.sql
-- Supabase Storage buckets for file uploads
-- Run in Supabase SQL Editor
-- ============================================================

-- Create the course-content bucket (public so files are accessible via URL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-content', 'course-content', true)
ON CONFLICT (id) DO NOTHING;

-- ─── Storage RLS Policies ────────────────────────────────

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course-content');

-- Allow anyone to read public files
CREATE POLICY "Public read access for course content"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'course-content');

-- Allow file owners and admins to update files
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'course-content' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Allow file owners and admins to delete files
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'course-content' AND (auth.uid())::text = (storage.foldername(name))[1]);
