-- ============================================
-- Collector's Paradise — Vendor Auth & Storage Update
-- Run this in the Supabase SQL Editor to apply changes
-- ============================================

-- 1. Alter the vendors table to include auth link and logo
ALTER TABLE public.vendors
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN logo_url TEXT;

-- NOTE: user_id is nullable to support anonymous vendor applications
-- (The current public vendor form doesn't require authentication)
-- Future versions can enforce NOT NULL once auth flow is implemented

-- Make business_name unique to prevent duplicate businesses even with different emails
ALTER TABLE public.vendors
  ADD CONSTRAINT vendors_business_name_key UNIQUE (business_name);

-- 2. Create the storage bucket for vendor logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor_logos',
  'vendor_logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up Storage RLS Policies for the bucket
-- Allow public viewing of logos
CREATE POLICY "Public can view vendor logos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'vendor_logos' );

-- Allow public vendor applications to upload logos.
-- The form is intentionally anonymous, so restricting this to authenticated users
-- causes real applicants to fail storage RLS before their application is saved.
CREATE POLICY "Anyone can upload vendor logos"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'vendor_logos' AND
  name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/logo-[0-9]+\.(jpg|png|webp|gif)$'
);

-- Allow authenticated users to update their own logos
CREATE POLICY "Vendors can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vendor_logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own logos
CREATE POLICY "Vendors can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vendor_logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
