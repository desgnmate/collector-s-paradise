-- Run after add_vendor_event_applications.sql if that migration was already
-- applied. Vendor application_status must remain the original legacy status;
-- event-specific decisions live in vendor_event_applications.

DROP TRIGGER IF EXISTS refresh_vendor_status_after_event_application
  ON public.vendor_event_applications;
DROP FUNCTION IF EXISTS public.refresh_vendor_application_status();

-- Restore original status for every record that came from the old event_id
-- relationship. Unassigned vendors were never changed by the trigger.
UPDATE public.vendors AS vendor
SET application_status = application.application_status
FROM public.vendor_event_applications AS application
WHERE vendor.id = application.vendor_id
  AND vendor.event_id = application.event_id;
