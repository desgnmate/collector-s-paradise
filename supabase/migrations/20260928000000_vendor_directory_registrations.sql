-- Apply after 20260907000000_verified_vendor_reapplications.sql, before deploying UI.
BEGIN;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS directory_approved boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.vendor_directory_registration_available() RETURNS boolean
LANGUAGE sql STABLE SET search_path='' AS $$ SELECT true $$;
REVOKE ALL ON FUNCTION public.vendor_directory_registration_available() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vendor_directory_registration_available() TO anon,authenticated;

CREATE TABLE IF NOT EXISTS public.vendor_registration_requests (
  id uuid PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('directory', 'events')),
  details jsonb NOT NULL,
  event_ids uuid[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processed','declined')),
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);
ALTER TABLE public.vendor_registration_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.vendor_registration_requests FROM anon, authenticated;
GRANT SELECT ON public.vendor_registration_requests TO authenticated;
CREATE POLICY "Admins read vendor registration requests" ON public.vendor_registration_requests
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id=auth.uid()));

-- Existing event-only registration is unchanged for new identities. Matches
-- and directory requests are stored separately; email is not proof of ownership.
CREATE OR REPLACE FUNCTION public.submit_vendor_registration(
  p_vendor_id uuid,p_business_name text,p_contact_name text,p_email text,p_phone text,p_location_state text,
  p_description text,p_categories text[],p_logo_url text,p_social_links text,p_tables_requested text,
  p_power_requirements text,p_additional_notes text,p_event_ids uuid[]
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE identity_name text := lower(regexp_replace(btrim(p_business_name),'[[:space:]]+',' ','g'));
  normalized_email text := lower(btrim(p_email)); matched boolean;
BEGIN
  IF coalesce(length(btrim(p_business_name)),0) NOT BETWEEN 1 AND 200
    OR coalesce(length(btrim(p_contact_name)),0) NOT BETWEEN 1 AND 200
    OR coalesce(p_email,'') !~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
    OR coalesce(length(btrim(p_location_state)),0)=0
    OR coalesce(length(btrim(p_description)),0) NOT BETWEEN 10 AND 1000
    OR coalesce(cardinality(p_categories),0) NOT BETWEEN 1 AND 30
    OR coalesce(p_social_links,'') !~ '^https?://'
    OR coalesce(p_logo_url,'') !~ '^https?://'
    OR length(coalesce(p_additional_notes,''))>2000
    OR p_event_ids IS NULL OR cardinality(p_event_ids)>20
    OR cardinality(p_event_ids)<>(SELECT count(DISTINCT x) FROM unnest(p_event_ids) x)
  THEN RAISE EXCEPTION 'Invalid registration.' USING ERRCODE='22023'; END IF;
  IF cardinality(p_event_ids)>0 THEN
    IF coalesce(p_tables_requested,'') NOT IN ('1','2','3','4','5+') THEN
      RAISE EXCEPTION 'Select table requirements.' USING ERRCODE='22023'; END IF;
    PERFORM id FROM public.events WHERE id=ANY(p_event_ids) ORDER BY id FOR SHARE;
    IF (SELECT count(*) FROM public.events WHERE id=ANY(p_event_ids) AND status='upcoming'
      AND event_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Australia/Melbourne')::date)<>cardinality(p_event_ids)
    THEN RAISE EXCEPTION 'Selected event unavailable.' USING ERRCODE='22023'; END IF;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('vendor-business:' || identity_name,0));
  PERFORM pg_advisory_xact_lock(hashtextextended('vendor-email:' || normalized_email,0));
  SELECT EXISTS(SELECT 1 FROM public.vendors WHERE lower(btrim(email))=normalized_email
    OR lower(regexp_replace(btrim(business_name),'[[:space:]]+',' ','g'))=identity_name) INTO matched;
  IF cardinality(p_event_ids)>0 AND NOT matched THEN
    RETURN public.submit_vendor_with_events(p_vendor_id,p_business_name,p_contact_name,normalized_email,p_phone,
      p_location_state,p_description,p_categories,p_logo_url,p_social_links,p_tables_requested,
      p_power_requirements,p_additional_notes,p_event_ids);
  END IF;
  INSERT INTO public.vendor_registration_requests(id,kind,details,event_ids) VALUES (
    p_vendor_id, CASE WHEN cardinality(p_event_ids)=0 THEN 'directory' ELSE 'events' END,
    jsonb_build_object('business_name',btrim(p_business_name),'contact_name',btrim(p_contact_name),
      'email',normalized_email,'phone',p_phone,'location_state',p_location_state,'description',p_description,
      'categories',p_categories,'logo_url',p_logo_url,'social_links',p_social_links,
      'tables_requested',p_tables_requested,'power_requirements',p_power_requirements,'additional_notes',p_additional_notes),p_event_ids);
  -- Only return the submitted request ID, never an existing profile or match details.
  RETURN jsonb_build_object('review_request_id',p_vendor_id);
END;
$$;
REVOKE ALL ON FUNCTION public.submit_vendor_registration(uuid,text,text,text,text,text,text,text[],text,text,text,text,text,uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_vendor_registration(uuid,text,text,text,text,text,text,text[],text,text,text,text,text,uuid[]) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.review_vendor_registration(p_request_id uuid,p_vendor_id uuid,p_decline boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE request public.vendor_registration_requests%ROWTYPE; target uuid; d jsonb;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id=auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required.' USING ERRCODE='42501'; END IF;
  SELECT * INTO request FROM public.vendor_registration_requests WHERE id=p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request unavailable.'; END IF;
  IF request.status<>'pending' THEN RAISE EXCEPTION 'Request already reviewed.'; END IF;
  IF p_decline THEN
    UPDATE public.vendor_registration_requests SET status='declined',reviewed_at=now(),reviewed_by=auth.uid() WHERE id=p_request_id;
    RETURN NULL;
  END IF;
  d:=request.details;
  PERFORM pg_advisory_xact_lock(hashtextextended('vendor-business:' || lower(regexp_replace(btrim(d->>'business_name'),'[[:space:]]+',' ','g')),0));
  PERFORM pg_advisory_xact_lock(hashtextextended('vendor-email:' || lower(btrim(d->>'email')),0));
  IF request.kind='events' THEN
    PERFORM id FROM public.events WHERE id=ANY(request.event_ids) ORDER BY id FOR SHARE;
    IF (SELECT count(*) FROM public.events WHERE id=ANY(request.event_ids) AND status='upcoming'
      AND event_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Australia/Melbourne')::date)<>cardinality(request.event_ids)
    THEN RAISE EXCEPTION 'Selected event unavailable. Decline this request and ask for a new application.'; END IF;
  END IF;
  target:=p_vendor_id;
  IF target IS NULL THEN
    IF EXISTS(SELECT 1 FROM public.vendors WHERE lower(btrim(email))=lower(btrim(d->>'email'))
      OR lower(regexp_replace(btrim(business_name),'[[:space:]]+',' ','g'))=lower(regexp_replace(btrim(d->>'business_name'),'[[:space:]]+',' ','g')))
    THEN RAISE EXCEPTION 'Possible existing vendor. Review and select the matching profile, or decline.'; END IF;
    target:=gen_random_uuid();
    INSERT INTO public.vendors(id,business_name,contact_name,email,phone,location_state,description,categories,
      logo_url,social_links,tables_requested,power_requirements,additional_notes,application_status,event_id,directory_approved)
    VALUES(target,d->>'business_name',d->>'contact_name',d->>'email',d->>'phone',d->>'location_state',d->>'description',
      ARRAY(SELECT jsonb_array_elements_text(d->'categories')),d->>'logo_url',d->>'social_links',
      nullif(d->>'tables_requested',''),nullif(d->>'power_requirements',''),d->>'additional_notes',
      CASE WHEN request.kind='directory' THEN 'approved' ELSE 'pending' END,NULL,request.kind='directory');
  ELSE
    PERFORM id FROM public.vendors WHERE id=target FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Vendor unavailable.'; END IF;
    IF request.kind='directory' THEN
      UPDATE public.vendors SET directory_approved=true WHERE id=target;
    END IF;
  END IF;
  IF request.kind='events' THEN
    INSERT INTO public.vendor_event_applications(vendor_id,event_id,application_status,tables_requested,power_requirements,additional_notes)
    SELECT target,event_id,'pending',d->>'tables_requested',nullif(d->>'power_requirements',''),d->>'additional_notes'
    FROM unnest(request.event_ids) event_id ON CONFLICT (vendor_id,event_id) DO NOTHING;
  END IF;
  UPDATE public.vendor_registration_requests SET status='processed',vendor_id=target,reviewed_at=now(),reviewed_by=auth.uid() WHERE id=p_request_id;
  RETURN target;
END;
$$;
REVOKE ALL ON FUNCTION public.review_vendor_registration(uuid,uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_vendor_registration(uuid,uuid,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.remove_vendor_directory_approval(p_vendor_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id=auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required.' USING ERRCODE='42501'; END IF;
  UPDATE public.vendors v SET directory_approved=false,
    -- The legacy unassigned directory also uses application_status.
    application_status=CASE WHEN v.application_status='approved' AND NOT EXISTS(
      SELECT 1 FROM public.vendor_event_applications a WHERE a.vendor_id=v.id
    ) THEN 'pending' ELSE v.application_status END
  WHERE v.id=p_vendor_id AND v.directory_approved;
END;
$$;
REVOKE ALL ON FUNCTION public.remove_vendor_directory_approval(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.remove_vendor_directory_approval(uuid) TO authenticated;

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
      (p_event_id IS NULL AND vendor.directory_approved)
      OR (
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
NOTIFY pgrst, 'reload schema';
COMMIT;
