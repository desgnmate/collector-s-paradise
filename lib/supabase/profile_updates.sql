-- ============================================
-- Collector's Paradise — Profile & Storage Fix
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Ensure Profiles Table has avatar_url
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Ensure Buckets Exist and are Public
-- This registers the buckets in the storage.buckets table
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('vendor_logos', 'vendor_logos', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Clear out any broken policies to start fresh
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view vendor logos" ON storage.objects;
DROP POLICY IF EXISTS "Vendors can manage their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Vendors can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload vendor logos" ON storage.objects;

-- 4. POLICIES FOR: avatars
-- Allow anyone to see profile pictures
CREATE POLICY "Public can view avatars" ON storage.objects 
FOR SELECT USING ( bucket_id = 'avatars' );

-- Allow logged-in users to manage their own folder (folder name must be their UID)
CREATE POLICY "Users can manage their own avatars" ON storage.objects 
FOR ALL TO authenticated 
USING ( 
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text 
)
WITH CHECK ( 
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text 
);

-- 5. POLICIES FOR: vendor_logos
-- Allow anyone to see vendor logos
CREATE POLICY "Public can view vendor logos" ON storage.objects 
FOR SELECT USING ( bucket_id = 'vendor_logos' );

-- Allow public vendor applications to upload logos.
CREATE POLICY "Anyone can upload vendor logos" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'vendor_logos' AND
  name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/logo-[0-9]+\.(jpg|png|webp|gif)$'
);
