-- Collector's Paradise — close vendor applications once an event's spots are filled.
-- Apply before deploying the matching application code. Additive and safe to re-run.
BEGIN;

-- NULL = accepting applications. A timestamp records when an admin closed them.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS vendor_applications_closed_at timestamptz;

-- Public roles only hold column-level SELECT on events (security_hardening.sql).
-- The application form needs this flag to hide closed events; it is not sensitive.
GRANT SELECT (vendor_applications_closed_at) ON TABLE public.events TO anon, authenticated;

-- Delivery tracking for the "spots filled / not accepted" email.
-- NULL = this application was never part of a closure.
ALTER TABLE public.vendor_event_applications
  ADD COLUMN IF NOT EXISTS closure_notice_status text,
  ADD COLUMN IF NOT EXISTS closure_notice_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS closure_notice_last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS closure_notice_resend_id text,
  ADD COLUMN IF NOT EXISTS closure_notice_error text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'vendor_event_applications_closure_notice_status_check'
      AND conrelid = 'public.vendor_event_applications'::regclass
  ) THEN
    ALTER TABLE public.vendor_event_applications
      ADD CONSTRAINT vendor_event_applications_closure_notice_status_check
      CHECK (
        closure_notice_status IS NULL OR closure_notice_status IN (
          'pending', 'sending', 'sent', 'failed',
          'delivered', 'bounced', 'complained', 'suppressed'
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_vendor_event_applications_closure_notice
  ON public.vendor_event_applications(event_id, closure_notice_status)
  WHERE closure_notice_status IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_event_applications_closure_notice_resend_id
  ON public.vendor_event_applications(closure_notice_resend_id)
  WHERE closure_notice_resend_id IS NOT NULL;

-- One backstop for every submission path (new registration, returning vendor,
-- registration review queue, and any future path): once an event is closed,
-- requests carrying a public or signed-in JWT cannot create applications.
-- The server-side admin client (service_role) and direct SQL remain able to
-- place a vendor manually.
CREATE OR REPLACE FUNCTION public.block_closed_vendor_event_applications() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  closed_at timestamptz;
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') NOT IN ('', 'service_role') THEN
    -- Share-lock the event so a concurrent close waits for this insert and
    -- then includes it in the "not accepted" sweep.
    SELECT vendor_applications_closed_at INTO closed_at
    FROM public.events WHERE id = NEW.event_id FOR SHARE;
    IF closed_at IS NOT NULL THEN
      RAISE EXCEPTION 'Selected event unavailable: vendor applications are closed.'
        USING ERRCODE = '22023';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.block_closed_vendor_event_applications() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS vendor_event_applications_block_closed ON public.vendor_event_applications;
CREATE TRIGGER vendor_event_applications_block_closed
  BEFORE INSERT ON public.vendor_event_applications
  FOR EACH ROW EXECUTE FUNCTION public.block_closed_vendor_event_applications();

COMMENT ON COLUMN public.events.vendor_applications_closed_at IS
  'When an admin closed vendor applications for this event. NULL means applications are open.';
COMMENT ON COLUMN public.vendor_event_applications.closure_notice_status IS
  'Resend lifecycle state for the "vendor spots filled" not-accepted email. NULL when never queued.';

NOTIFY pgrst, 'reload schema';
COMMIT;
