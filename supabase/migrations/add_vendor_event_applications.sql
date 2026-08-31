-- Collector's Paradise — multi-event vendor applications
-- Run in Supabase SQL Editor before deploying this feature.

-- Keep this migration self-contained for projects that only have the original
-- vendors table. Every statement below is safe to run more than once.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS location_state TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS social_links TEXT,
  ADD COLUMN IF NOT EXISTS tables_requested TEXT,
  ADD COLUMN IF NOT EXISTS power_requirements TEXT,
  ADD COLUMN IF NOT EXISTS additional_notes TEXT,
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

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
DROP FUNCTION IF EXISTS public.submit_vendor_with_events(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT, TEXT, TEXT, TEXT, TEXT, UUID[]
);

CREATE FUNCTION public.submit_vendor_with_events(
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
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_count INTEGER;
  business_vendor_id UUID;
  email_vendor_id UUID;
  resolved_vendor_id UUID;
  resolved_logo_url TEXT;
  normalized_business_name TEXT;
  normalized_email TEXT;
  inserted_event_ids UUID[] := ARRAY[]::UUID[];
  created_vendor BOOLEAN := FALSE;
  uploaded_logo_used BOOLEAN := FALSE;
BEGIN
  IF
    COALESCE(length(btrim(p_business_name)), 0) < 1 OR
    COALESCE(length(btrim(p_contact_name)), 0) < 1 OR
    COALESCE(p_email, '') !~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' OR
    COALESCE(length(btrim(p_location_state)), 0) < 1 OR
    COALESCE(length(btrim(p_description)), 0) < 10 OR
    COALESCE(cardinality(p_categories), 0) < 1 OR
    COALESCE(length(btrim(p_social_links)), 0) < 1 OR
    COALESCE(length(btrim(p_tables_requested)), 0) < 1 OR
    COALESCE(length(btrim(p_logo_url)), 0) < 1
  THEN
    RAISE EXCEPTION 'Invalid vendor application.' USING ERRCODE = '22023';
  END IF;

  IF COALESCE(cardinality(p_event_ids), 0) < 1 THEN
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
    AND event_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Australia/Melbourne')::date;

  IF selected_count <> cardinality(p_event_ids) THEN
    RAISE EXCEPTION 'One or more selected events are unavailable.' USING ERRCODE = '22023';
  END IF;

  normalized_business_name := lower(
    regexp_replace(btrim(p_business_name), '[[:space:]]+', ' ', 'g')
  );
  normalized_email := lower(btrim(p_email));

  -- Serialize submissions for the same canonical identity. This closes the
  -- race where two differently-cased requests could both create profiles.
  PERFORM pg_advisory_xact_lock(
    hashtextextended('vendor-business:' || normalized_business_name, 0)
  );
  PERFORM pg_advisory_xact_lock(
    hashtextextended('vendor-email:' || normalized_email, 0)
  );

  -- Prefer a row where both identity fields match. Looking up each field
  -- independently can select different legacy rows and reject a valid repeat
  -- application even when an exact profile exists.
  SELECT id INTO resolved_vendor_id
  FROM public.vendors
  WHERE lower(regexp_replace(btrim(business_name), '[[:space:]]+', ' ', 'g')) = normalized_business_name
    AND lower(btrim(email)) = normalized_email
  ORDER BY applied_at ASC NULLS LAST, id ASC
  LIMIT 1;

  IF resolved_vendor_id IS NOT NULL THEN
    SELECT logo_url INTO resolved_logo_url
    FROM public.vendors
    WHERE id = resolved_vendor_id;

    IF resolved_logo_url IS NULL OR length(btrim(resolved_logo_url)) = 0 THEN
      UPDATE public.vendors
      SET logo_url = p_logo_url
      WHERE id = resolved_vendor_id;
      resolved_logo_url := p_logo_url;
      uploaded_logo_used := TRUE;
    END IF;
  ELSE
    SELECT id INTO business_vendor_id
    FROM public.vendors
    WHERE lower(regexp_replace(btrim(business_name), '[[:space:]]+', ' ', 'g')) = normalized_business_name
    ORDER BY applied_at ASC NULLS LAST, id ASC
    LIMIT 1;

    SELECT id INTO email_vendor_id
    FROM public.vendors
    WHERE lower(btrim(email)) = normalized_email
    ORDER BY applied_at ASC NULLS LAST, id ASC
    LIMIT 1;

    IF business_vendor_id IS NOT NULL OR email_vendor_id IS NOT NULL THEN
      RAISE EXCEPTION 'Business name and email conflict with an existing vendor profile.'
        USING ERRCODE = '23505';
    END IF;

    resolved_vendor_id := p_vendor_id;
    resolved_logo_url := p_logo_url;
    created_vendor := TRUE;
    uploaded_logo_used := TRUE;

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
      resolved_vendor_id,
      regexp_replace(btrim(p_business_name), '[[:space:]]+', ' ', 'g'),
      btrim(p_contact_name),
      normalized_email,
      NULLIF(btrim(p_phone), ''),
      btrim(p_location_state),
      btrim(p_description),
      p_categories,
      p_logo_url,
      NULLIF(btrim(p_social_links), ''),
      btrim(p_tables_requested),
      NULLIF(btrim(p_power_requirements), ''),
      NULLIF(btrim(p_additional_notes), ''),
      'pending',
      NULL
    );
  END IF;

  WITH inserted AS (
    INSERT INTO public.vendor_event_applications (
      vendor_id,
      event_id,
      application_status,
      tables_requested,
      power_requirements
    )
    SELECT
      resolved_vendor_id,
      selected_event_id,
      'pending',
      btrim(p_tables_requested),
      NULLIF(btrim(p_power_requirements), '')
    FROM unnest(p_event_ids) AS selected_event_id
    ON CONFLICT (vendor_id, event_id) DO NOTHING
    RETURNING event_id
  )
  SELECT COALESCE(array_agg(event_id), ARRAY[]::UUID[])
  INTO inserted_event_ids
  FROM inserted;

  RETURN jsonb_build_object(
    'vendor_id', resolved_vendor_id,
    'logo_url', resolved_logo_url,
    'created', created_vendor,
    'uploaded_logo_used', uploaded_logo_used,
    'inserted_event_ids', inserted_event_ids,
    'already_applied', cardinality(inserted_event_ids) = 0
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_vendor_with_events(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT, TEXT, TEXT, TEXT, TEXT, UUID[]
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.submit_vendor_with_events(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT, TEXT, TEXT, TEXT, TEXT, UUID[]
) TO anon, authenticated;

-- All public submissions now go through the atomic function above. Removing
-- the legacy direct-insert policy prevents callers from bypassing identity
-- matching, advisory locking, and vendor/event deduplication.
DROP POLICY IF EXISTS "Anyone can apply as vendor" ON public.vendors;

COMMENT ON TABLE public.vendor_event_applications IS
  'Independent vendor decisions and event requirements for each selected event.';

-- Make the new RPC visible to PostgREST immediately after the SQL is applied.
NOTIFY pgrst, 'reload schema';
