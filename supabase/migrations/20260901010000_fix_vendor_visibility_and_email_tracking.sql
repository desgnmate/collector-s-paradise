-- Keep pending and waitlisted vendor applications private, and persist the
-- latest vendor-facing application receipt delivery state.

BEGIN;

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS application_receipt_status TEXT NOT NULL DEFAULT 'not_sent',
  ADD COLUMN IF NOT EXISTS application_receipt_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS application_receipt_last_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS application_receipt_attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS application_receipt_resend_id TEXT,
  ADD COLUMN IF NOT EXISTS application_receipt_error TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'vendors_application_receipt_status_check'
      AND conrelid = 'public.vendors'::regclass
  ) THEN
    ALTER TABLE public.vendors
      ADD CONSTRAINT vendors_application_receipt_status_check
      CHECK (
        application_receipt_status IN (
          'not_sent', 'sending', 'sent', 'failed',
          'delivered', 'bounced', 'complained', 'suppressed'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'vendors_application_receipt_attempt_count_check'
      AND conrelid = 'public.vendors'::regclass
  ) THEN
    ALTER TABLE public.vendors
      ADD CONSTRAINT vendors_application_receipt_attempt_count_check
      CHECK (application_receipt_attempt_count >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_vendors_application_receipt_status
  ON public.vendors(application_receipt_status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_application_receipt_resend_id
  ON public.vendors(application_receipt_resend_id)
  WHERE application_receipt_resend_id IS NOT NULL;

COMMENT ON COLUMN public.vendors.application_receipt_status IS
  'Latest Resend lifecycle state for the vendor-facing application receipt.';

CREATE OR REPLACE FUNCTION public.get_public_vendor_directory(
  p_event_id UUID DEFAULT NULL,
  p_unassigned_only BOOLEAN DEFAULT TRUE,
  p_offset INTEGER DEFAULT 0,
  p_limit INTEGER DEFAULT 6
)
RETURNS TABLE (
  id UUID,
  business_name TEXT,
  contact_name TEXT,
  description TEXT,
  categories TEXT[],
  logo_url TEXT,
  social_links TEXT,
  booth_assignment TEXT,
  event_applications JSONB,
  total_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH eligible_vendors AS (
    SELECT vendor.*
    FROM public.vendors AS vendor
    WHERE
      (
        p_event_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.vendor_event_applications AS application
          WHERE application.vendor_id = vendor.id
            AND application.event_id = p_event_id
            AND application.application_status = 'approved'
        )
      )
      OR (
        p_event_id IS NULL
        AND p_unassigned_only
        AND vendor.application_status = 'approved'
        AND NOT EXISTS (
          SELECT 1
          FROM public.vendor_event_applications AS application
          WHERE application.vendor_id = vendor.id
        )
      )
      OR (
        p_event_id IS NULL
        AND NOT p_unassigned_only
        AND (
          EXISTS (
            SELECT 1
            FROM public.vendor_event_applications AS application
            WHERE application.vendor_id = vendor.id
              AND application.application_status = 'approved'
          )
          OR (
            vendor.application_status = 'approved'
            AND NOT EXISTS (
              SELECT 1
              FROM public.vendor_event_applications AS application
              WHERE application.vendor_id = vendor.id
            )
          )
        )
      )
  ),
  counted_vendors AS (
    SELECT vendor.*, COUNT(*) OVER () AS total_count
    FROM eligible_vendors AS vendor
    ORDER BY vendor.business_name ASC
    OFFSET GREATEST(p_offset, 0)
    LIMIT LEAST(GREATEST(p_limit, 1), 48)
  )
  SELECT
    vendor.id,
    vendor.business_name,
    vendor.contact_name,
    vendor.description,
    vendor.categories,
    vendor.logo_url,
    vendor.social_links,
    selected_application.booth_assignment,
    COALESCE(applications.items, '[]'::JSONB) AS event_applications,
    vendor.total_count
  FROM counted_vendors AS vendor
  LEFT JOIN LATERAL (
    SELECT application.booth_assignment
    FROM public.vendor_event_applications AS application
    WHERE application.vendor_id = vendor.id
      AND application.event_id = p_event_id
      AND application.application_status = 'approved'
    LIMIT 1
  ) AS selected_application ON p_event_id IS NOT NULL
  LEFT JOIN LATERAL (
    SELECT JSONB_AGG(
      JSONB_BUILD_OBJECT(
        'id', application.id,
        'vendor_id', application.vendor_id,
        'event_id', application.event_id,
        'application_status', application.application_status,
        'booth_assignment', application.booth_assignment,
        'event_name', event.title,
        'event_date', event.event_date,
        'event_venue', event.venue
      )
      ORDER BY event.event_date ASC
    ) AS items
    FROM public.vendor_event_applications AS application
    JOIN public.events AS event ON event.id = application.event_id
    WHERE application.vendor_id = vendor.id
      AND application.application_status = 'approved'
      AND (p_event_id IS NULL OR application.event_id = p_event_id)
  ) AS applications ON TRUE;
$$;

REVOKE ALL ON FUNCTION public.get_public_vendor_directory(UUID, BOOLEAN, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_vendor_directory(UUID, BOOLEAN, INTEGER, INTEGER) TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_vendor_directory(UUID, BOOLEAN, INTEGER, INTEGER) IS
  'Returns public-safe vendor profile fields for approved legacy profiles and approved event applications only.';

NOTIFY pgrst, 'reload schema';

COMMIT;
