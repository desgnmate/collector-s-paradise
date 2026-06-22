-- ============================================
-- Collector's Paradise — Add location_state to vendors
-- Run this in the Supabase SQL Editor
-- ============================================

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS location_state TEXT;

COMMENT ON COLUMN public.vendors.location_state IS 'Australian state or territory where the vendor is based';
