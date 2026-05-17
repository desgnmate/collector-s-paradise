-- ============================================
-- Collector's Paradise — Add booking_link to events
-- Run this in the Supabase SQL Editor to apply changes
-- ============================================

-- Add the missing booking_link column that the app code references
-- but is absent from the original schema.sql
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS booking_link TEXT;
