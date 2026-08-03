-- Collector's Paradise — multi-event vendor applications
-- Run in Supabase SQL Editor before deploying this feature.

CREATE TABLE IF NOT EXISTS public.vendor_event_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  application_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (application_status IN ('pending', 'approved', 'rejected', 'waitlisted')),
  tables_requested TEXT,
  power_requirements TEXT,
  booth_assignment TEXT,
  rejection_reason TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (vendor_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_vendor_event_applications_vendor
  ON public.vendor_event_applications(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_event_applications_event_status
  ON public.vendor_event_applications(event_id, application_status);

ALTER TABLE public.vendor_event_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Approved vendor event applications are public" ON public.vendor_event_applications;
CREATE POLICY "Approved vendor event applications are public"
  ON public.vendor_event_applications FOR SELECT
  TO anon, authenticated
  USING (application_status = 'approved');

DROP POLICY IF EXISTS "Admins can manage vendor event applications" ON public.vendor_event_applications;
CREATE POLICY "Admins can manage vendor event applications"
  ON public.vendor_event_applications FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Preserve existing single-event applications and decisions.
INSERT INTO public.vendor_event_applications (
  vendor_id,
  event_id,
  application_status,
  tables_requested,
  power_requirements,
  booth_assignment,
  rejection_reason,
  applied_at,
  updated_at
)
SELECT
  id,
  event_id,
  application_status,
  tables_requested,
  power_requirements,
  booth_assignment,
  rejection_reason,
  COALESCE(applied_at, NOW()),
  NOW()
FROM public.vendors
WHERE event_id IS NOT NULL
ON CONFLICT (vendor_id, event_id) DO NOTHING;

-- Keep vendors.application_status unchanged as legacy profile status.
-- Event decisions live only in vendor_event_applications.

-- Public vendor cards follow event-specific approval. Legacy approved vendors
-- without an event remain visible until they receive event applications.
DROP POLICY IF EXISTS "Approved vendors are publicly readable" ON public.vendors;
CREATE POLICY "Approved vendors are publicly readable"
  ON public.vendors FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.vendor_event_applications application
      WHERE application.vendor_id = vendors.id
        AND application.application_status = 'approved'
    )
    OR (application_status = 'approved' AND event_id IS NULL)
  );

-- Atomic public submission. SECURITY DEFINER permits anonymous applicants to use
-- one transaction without granting direct INSERT access to event decisions.
CREATE OR REPLACE FUNCTION public.submit_vendor_with_events(
  p_vendor_id UUID,
  p_business_name TEXT,
  p_contact_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_location_state TEXT,
  p_description TEXT,
  p_categories TEXT[],
  p_logo_url TEXT,
  p_social_links TEXT,
  p_tables_requested TEXT,
  p_power_requirements TEXT,
  p_additional_notes TEXT,
  p_event_ids UUID[]
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_count INTEGER;
BEGIN
  IF
    length(trim(p_business_name)) < 1 OR
    length(trim(p_contact_name)) < 1 OR
    p_email !~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' OR
    length(trim(p_location_state)) < 1 OR
    length(trim(p_description)) < 10 OR
    cardinality(p_categories) < 1 OR
    length(trim(p_social_links)) < 1 OR
    length(trim(p_tables_requested)) < 1 OR
    length(trim(p_logo_url)) < 1
  THEN
    RAISE EXCEPTION 'Invalid vendor application.' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.vendors
    WHERE lower(business_name) = lower(trim(p_business_name))
       OR lower(email) = lower(trim(p_email))
  ) THEN
    RAISE EXCEPTION 'Vendor profile already exists.' USING ERRCODE = '23505';
  END IF;

  IF cardinality(p_event_ids) < 1 THEN
    RAISE EXCEPTION 'Select at least one event.' USING ERRCODE = '22023';
  END IF;

  IF cardinality(p_event_ids) <> (
    SELECT COUNT(DISTINCT selected_id)
    FROM unnest(p_event_ids) AS selected_id
  ) THEN
    RAISE EXCEPTION 'Duplicate event selection.' USING ERRCODE = '22023';
  END IF;

  SELECT COUNT(*) INTO selected_count
  FROM public.events
  WHERE id = ANY(p_event_ids)
    AND status = 'upcoming'
    AND event_date >= CURRENT_DATE;

  IF selected_count <> cardinality(p_event_ids) THEN
    RAISE EXCEPTION 'One or more selected events are unavailable.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.vendors (
    id,
    business_name,
    contact_name,
    email,
    phone,
    location_state,
    description,
    categories,
    logo_url,
    social_links,
    tables_requested,
    power_requirements,
    additional_notes,
    application_status,
    event_id
  ) VALUES (
    p_vendor_id,
    trim(p_business_name),
    trim(p_contact_name),
    lower(trim(p_email)),
    NULLIF(trim(p_phone), ''),
    trim(p_location_state),
    trim(p_description),
    p_categories,
    p_logo_url,
    NULLIF(trim(p_social_links), ''),
    trim(p_tables_requested),
    NULLIF(trim(p_power_requirements), ''),
    NULLIF(trim(p_additional_notes), ''),
    'pending',
    NULL
  );

  INSERT INTO public.vendor_event_applications (
    vendor_id,
    event_id,
    application_status,
    tables_requested,
    power_requirements
  )
  SELECT
    p_vendor_id,
    selected_event_id,
    'pending',
    trim(p_tables_requested),
    NULLIF(trim(p_power_requirements), '')
  FROM unnest(p_event_ids) AS selected_event_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_vendor_with_events(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT, TEXT, TEXT, TEXT, TEXT, UUID[]
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.submit_vendor_with_events(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT, TEXT, TEXT, TEXT, TEXT, UUID[]
) TO anon, authenticated;

COMMENT ON TABLE public.vendor_event_applications IS
  'Independent vendor decisions and event requirements for each selected event.';
