-- Allow one vendor profile to apply to multiple events without duplicating
-- the vendor record. Safe to run after add_vendor_event_applications.sql.

BEGIN;

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
  inserted_event_ids UUID[] := ARRAY[]::UUID[];
  created_vendor BOOLEAN := FALSE;
  uploaded_logo_used BOOLEAN := FALSE;
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
    AND event_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Australia/Melbourne')::date;

  IF selected_count <> cardinality(p_event_ids) THEN
    RAISE EXCEPTION 'One or more selected events are unavailable.' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO business_vendor_id
  FROM public.vendors
  WHERE lower(business_name) = lower(trim(p_business_name))
  ORDER BY applied_at ASC NULLS LAST
  LIMIT 1;

  SELECT id INTO email_vendor_id
  FROM public.vendors
  WHERE lower(email) = lower(trim(p_email))
  ORDER BY applied_at ASC NULLS LAST
  LIMIT 1;

  IF business_vendor_id IS NOT NULL OR email_vendor_id IS NOT NULL THEN
    IF
      business_vendor_id IS NULL OR
      email_vendor_id IS NULL OR
      business_vendor_id <> email_vendor_id
    THEN
      RAISE EXCEPTION 'Business name and email conflict with an existing vendor profile.'
        USING ERRCODE = '23505';
    END IF;

    resolved_vendor_id := business_vendor_id;
    SELECT logo_url INTO resolved_logo_url
    FROM public.vendors
    WHERE id = resolved_vendor_id;

    IF resolved_logo_url IS NULL OR length(trim(resolved_logo_url)) = 0 THEN
      UPDATE public.vendors
      SET logo_url = p_logo_url
      WHERE id = resolved_vendor_id;
      resolved_logo_url := p_logo_url;
      uploaded_logo_used := TRUE;
    END IF;
  ELSE
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
      trim(p_tables_requested),
      NULLIF(trim(p_power_requirements), '')
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

NOTIFY pgrst, 'reload schema';

COMMIT;
