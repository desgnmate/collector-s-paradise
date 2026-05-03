-- Add booking_link column to events table
-- Run this in Supabase SQL Editor

ALTER TABLE events
ADD COLUMN IF NOT EXISTS booking_link TEXT;

-- Add index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_events_booking_link ON events (booking_link) WHERE booking_link IS NOT NULL;

COMMENT ON COLUMN events.booking_link IS 'External booking link (e.g. Eventbrite, TicketTailor URL)';
