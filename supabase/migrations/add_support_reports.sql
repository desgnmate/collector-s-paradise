-- Collector's Paradise support reports

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  reporter_name TEXT NOT NULL,
  reporter_email TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'website_bug', 'ticket_booking', 'vendor_account', 'event_information',
    'accessibility', 'payment_refund', 'other'
  )),
  impact TEXT NOT NULL CHECK (impact IN ('low', 'medium', 'high', 'urgent')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  page_url TEXT,
  browser_details TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
    'new', 'in_progress', 'waiting_on_reporter', 'resolved', 'closed'
  )),
  admin_notes TEXT,
  admin_notification_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    admin_notification_status IN ('pending', 'sent', 'failed')
  ),
  admin_notification_resend_id TEXT,
  admin_notification_error TEXT,
  admin_notification_attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (
    admin_notification_attempt_count >= 0
  ),
  admin_notification_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS reports_status_created_at_idx
  ON public.reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS reports_priority_created_at_idx
  ON public.reports (priority, created_at DESC);
CREATE INDEX IF NOT EXISTS reports_reporter_email_created_at_idx
  ON public.reports (reporter_email, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_reports_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reports_set_updated_at ON public.reports;
CREATE TRIGGER reports_set_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.set_reports_updated_at();

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.reports FROM anon, authenticated;
GRANT SELECT, UPDATE ON TABLE public.reports TO authenticated;

DROP POLICY IF EXISTS "Admins can view reports" ON public.reports;
CREATE POLICY "Admins can view reports"
ON public.reports
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
CREATE POLICY "Admins can update reports"
ON public.reports
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()
  )
);

COMMENT ON TABLE public.reports IS 'Support tickets submitted through the public reports page.';
COMMENT ON COLUMN public.reports.admin_notes IS 'Internal notes visible only to administrators.';
