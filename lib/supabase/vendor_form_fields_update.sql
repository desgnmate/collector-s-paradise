-- ============================================
-- Collector's Paradise — Vendor Form Fields Update
-- Run this in the Supabase SQL Editor to add new vendor registration fields
-- ============================================

-- Add new columns to the vendors table for enhanced registration form
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS social_links TEXT,
  ADD COLUMN IF NOT EXISTS tables_requested TEXT,
  ADD COLUMN IF NOT EXISTS power_requirements TEXT,
  ADD COLUMN IF NOT EXISTS additional_notes TEXT;

-- Add comments to document the new columns
COMMENT ON COLUMN public.vendors.social_links IS 'Instagram, Facebook, or other social media profile URLs';
COMMENT ON COLUMN public.vendors.tables_requested IS 'Number of tables requested for the event (1-5+)';
COMMENT ON COLUMN public.vendors.power_requirements IS 'Electrical power requirements (none/standard/multiple/heavy)';
COMMENT ON COLUMN public.vendors.additional_notes IS 'Special setup requirements, accessibility needs, or other information';
