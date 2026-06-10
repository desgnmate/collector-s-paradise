-- Collector's Paradise — Add booking link to Gold Coast event
-- Run this in Supabase SQL Editor to update the Gold Coast event with the TryBooking link

UPDATE public.events
SET booking_link = 'https://www.trybooking.com/events/landing/1578181'
WHERE title ILIKE '%Gold Coast%';

-- Verify the update
SELECT id, title, event_date, venue, booking_link
FROM public.events
WHERE title ILIKE '%Gold Coast%';
