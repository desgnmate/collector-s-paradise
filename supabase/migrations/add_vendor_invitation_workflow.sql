-- Collector's Paradise — event-specific vendor invitation workflow
-- Apply before deploying the matching application code.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS vendor_table_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS vendor_power_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vendor_response_deadline DATE,
  ADD COLUMN IF NOT EXISTS vendor_load_in_time TIME,
  ADD COLUMN IF NOT EXISTS vendor_payment_link TEXT,
  ADD COLUMN IF NOT EXISTS vendor_contact_email TEXT,
  ADD COLUMN IF NOT EXISTS vendor_instructions TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'events_vendor_table_price_nonnegative'
      AND conrelid = 'public.events'::regclass
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_vendor_table_price_nonnegative
      CHECK (vendor_table_price IS NULL OR vendor_table_price >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'events_vendor_power_fee_nonnegative'
      AND conrelid = 'public.events'::regclass
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_vendor_power_fee_nonnegative
      CHECK (vendor_power_fee >= 0);
  END IF;
END $$;

ALTER TABLE public.vendor_event_applications
  ADD COLUMN IF NOT EXISTS approved_vendor_fee NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS invitation_status TEXT NOT NULL DEFAULT 'not_sent',
  ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invitation_last_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invitation_attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invitation_resend_id TEXT,
  ADD COLUMN IF NOT EXISTS invitation_error TEXT,
  ADD COLUMN IF NOT EXISTS invitation_version INTEGER NOT NULL DEFAULT 1;

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
    WHERE conname = 'vendor_event_applications_approved_fee_nonnegative'
      AND conrelid = 'public.vendor_event_applications'::regclass
  ) THEN
    ALTER TABLE public.vendor_event_applications
      ADD CONSTRAINT vendor_event_applications_approved_fee_nonnegative
      CHECK (approved_vendor_fee IS NULL OR approved_vendor_fee >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'vendor_event_applications_invitation_status_check'
      AND conrelid = 'public.vendor_event_applications'::regclass
  ) THEN
    ALTER TABLE public.vendor_event_applications
      ADD CONSTRAINT vendor_event_applications_invitation_status_check
      CHECK (
        invitation_status IN (
          'not_sent', 'sending', 'sent', 'failed',
          'delivered', 'bounced', 'complained', 'suppressed'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'vendor_event_applications_invitation_attempt_count_check'
      AND conrelid = 'public.vendor_event_applications'::regclass
  ) THEN
    ALTER TABLE public.vendor_event_applications
      ADD CONSTRAINT vendor_event_applications_invitation_attempt_count_check
      CHECK (invitation_attempt_count >= 0);
  END IF;

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

CREATE INDEX IF NOT EXISTS idx_vendor_event_applications_invitation_status
  ON public.vendor_event_applications(invitation_status)
  WHERE application_status = 'approved';

CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_event_applications_invitation_resend_id
  ON public.vendor_event_applications(invitation_resend_id)
  WHERE invitation_resend_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vendors_application_receipt_status
  ON public.vendors(application_receipt_status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_application_receipt_resend_id
  ON public.vendors(application_receipt_resend_id)
  WHERE application_receipt_resend_id IS NOT NULL;

COMMENT ON COLUMN public.events.vendor_table_price IS
  'Base AUD price per vendor table for approval invitation calculations.';
COMMENT ON COLUMN public.events.vendor_power_fee IS
  'AUD power surcharge applied when a vendor requests power.';
COMMENT ON COLUMN public.vendor_event_applications.approved_vendor_fee IS
  'Final AUD fee confirmed by an admin and included in the invitation.';
COMMENT ON COLUMN public.vendor_event_applications.invitation_status IS
  'Latest Resend lifecycle state for the event-specific vendor invitation.';
COMMENT ON COLUMN public.vendors.application_receipt_status IS
  'Latest Resend lifecycle state for the vendor-facing application receipt.';
