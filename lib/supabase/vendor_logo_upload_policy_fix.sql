-- ============================================
-- Collector's Paradise — Vendor Logo Upload Policy Fix
-- Run this in the Supabase SQL Editor if vendor applications fail during
-- logo upload with a storage row-level security error.
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor_logos',
  'vendor_logos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

DROP POLICY IF EXISTS "Vendors can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload vendor logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view vendor logos" ON storage.objects;

CREATE POLICY "Public can view vendor logos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'vendor_logos');

CREATE POLICY "Anyone can upload vendor logos"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'vendor_logos' AND
  name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/logo-[0-9]+\.(jpg|png|webp|gif)$'
);
