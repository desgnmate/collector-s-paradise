-- ============================================================
-- Collections Feature Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Create collections table
CREATE TABLE IF NOT EXISTS public.collections (
  id          UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id   UUID          NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  user_id     UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT          NOT NULL,
  description TEXT          NOT NULL,
  image_urls  TEXT[]        NOT NULL DEFAULT '{}',
  price_min   NUMERIC(10,2) NOT NULL,
  price_max   NUMERIC(10,2) NOT NULL,
  categories  TEXT[]        NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ   DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   DEFAULT NOW(),
  CONSTRAINT price_range_valid CHECK (price_min <= price_max)
);

-- 2. Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_collections_updated_at ON public.collections;
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_collections_vendor_id  ON public.collections(vendor_id);
CREATE INDEX IF NOT EXISTS idx_collections_user_id    ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON public.collections(created_at DESC);

-- 4. Enable Row Level Security
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Anyone (including guests) can read all collections
CREATE POLICY "Anyone can view collections"
  ON public.collections FOR SELECT
  USING (true);

-- Only the owning user can insert
CREATE POLICY "Vendors can insert their own collections"
  ON public.collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only the owning user can update
CREATE POLICY "Vendors can update their own collections"
  ON public.collections FOR UPDATE
  USING (auth.uid() = user_id);

-- Only the owning user can delete
CREATE POLICY "Vendors can delete their own collections"
  ON public.collections FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Storage bucket for collection images
INSERT INTO storage.buckets (id, name, public)
VALUES ('collection_images', 'collection_images', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Storage RLS policies
CREATE POLICY "Anyone can view collection images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'collection_images');

CREATE POLICY "Authenticated users can upload collection images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'collection_images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their own collection images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'collection_images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
