-- Collector's Paradise — Vendor Event Selection
-- Run in Supabase SQL Editor before deploying event selection.
-- Existing vendors stay valid with no selected event.

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vendors_event_id
  ON public.vendors(event_id);

COMMENT ON COLUMN public.vendors.event_id IS 'Optional upcoming event selected by vendor during application';
