-- Collector's Paradise security hardening
-- Run this migration in Supabase after reviewing it against the deployed schema.
-- The application now uses SUPABASE_SERVICE_ROLE_KEY only after an explicit
-- server-side admin_users check, so public roles can be restricted to the
-- fields needed by the directory and forms.

-- Public event pages never need the legacy cover_image_url data URL. Covers
-- are served through /api/events/[id]/cover by a server-only image route.
REVOKE ALL ON TABLE public.events FROM anon, authenticated;
GRANT SELECT (
  id, title, description, event_date, start_time, end_time, venue,
  venue_address, status, capacity, tickets_sold, ticket_price, booking_link,
  created_at, updated_at
) ON TABLE public.events TO anon, authenticated;

-- The vendor directory is intentionally a projection, not a public profile
-- table. Keep contact details, application state, assignments, and notes out
-- of PostgREST responses. Applications are submitted through the existing
-- SECURITY DEFINER function and reviewed through the server admin client.
REVOKE ALL ON TABLE public.vendors FROM anon, authenticated;
GRANT SELECT (
  id, business_name, contact_name, description, categories, logo_url,
  social_links, application_status
) ON TABLE public.vendors TO anon, authenticated;
GRANT INSERT ON TABLE public.vendors TO anon, authenticated;

REVOKE ALL ON TABLE public.vendor_event_applications FROM anon, authenticated;

-- No booking Server Action exists in this repository. Do not leave an open
-- guest INSERT path that lets clients forge payment/confirmation fields; add a
-- validated server-side checkout flow before granting INSERT again.
REVOKE INSERT ON TABLE public.bookings FROM anon, authenticated;
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;

-- Applicant details must never be readable or mutable from a client session.
-- Public forms retain INSERT access; server actions use the service-role client
-- only after checking admin_users.
DO $$
BEGIN
  IF to_regclass('public.sponsors') IS NOT NULL THEN
    REVOKE SELECT, UPDATE, DELETE ON TABLE public.sponsors FROM anon, authenticated;
    GRANT INSERT ON TABLE public.sponsors TO anon, authenticated;
    DROP POLICY IF EXISTS "Allow admins to read all sponsors" ON public.sponsors;
    DROP POLICY IF EXISTS "Allow admins to update sponsors" ON public.sponsors;
    DROP POLICY IF EXISTS "Allow admins to delete sponsors" ON public.sponsors;
    DROP POLICY IF EXISTS "Admins can read sponsors through server boundary" ON public.sponsors;
    DROP POLICY IF EXISTS "Admins can update sponsors through server boundary" ON public.sponsors;
    DROP POLICY IF EXISTS "Admins can delete sponsors through server boundary" ON public.sponsors;
    CREATE POLICY "Admins can read sponsors through server boundary"
      ON public.sponsors FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));
    CREATE POLICY "Admins can update sponsors through server boundary"
      ON public.sponsors FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));
    CREATE POLICY "Admins can delete sponsors through server boundary"
      ON public.sponsors FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));
  END IF;

  IF to_regclass('public.volunteers') IS NOT NULL THEN
    REVOKE SELECT, UPDATE, DELETE ON TABLE public.volunteers FROM anon, authenticated;
    GRANT INSERT ON TABLE public.volunteers TO anon, authenticated;
    DROP POLICY IF EXISTS "Allow admins to read all volunteers" ON public.volunteers;
    DROP POLICY IF EXISTS "Allow admins to update volunteers" ON public.volunteers;
    DROP POLICY IF EXISTS "Allow admins to delete volunteers" ON public.volunteers;
    DROP POLICY IF EXISTS "Admins can read volunteers through server boundary" ON public.volunteers;
    DROP POLICY IF EXISTS "Admins can update volunteers through server boundary" ON public.volunteers;
    DROP POLICY IF EXISTS "Admins can delete volunteers through server boundary" ON public.volunteers;
    CREATE POLICY "Admins can read volunteers through server boundary"
      ON public.volunteers FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));
    CREATE POLICY "Admins can update volunteers through server boundary"
      ON public.volunteers FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));
    CREATE POLICY "Admins can delete volunteers through server boundary"
      ON public.volunteers FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));
  END IF;
END;
$$;

-- PostgREST's default EXECUTE grant can expose future SECURITY DEFINER
-- functions accidentally. Keep the public directory RPC explicit.
REVOKE ALL ON FUNCTION public.get_public_vendor_directory(UUID, BOOLEAN, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_vendor_directory(UUID, BOOLEAN, INTEGER, INTEGER) TO anon, authenticated;
