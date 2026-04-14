-- ============================================
-- Collector's Paradise — Vendor Auth & Storage Update
-- Run this in the Supabase SQL Editor to apply changes
-- ============================================

-- 1. Alter the vendors table to include auth link and logo
ALTER TABLE public.vendors
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN logo_url TEXT;

-- Enforce that future vendors require a user_id
-- (Doing this after adding the column in case there are existing test rows)
ALTER TABLE public.vendors
  ALTER COLUMN user_id SET NOT NULL;

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

-- Allow authenticated users to upload their own logos
CREATE POLICY "Vendors can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor_logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
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
