-- Apply after 20260831000000 and 20260901010000. No profiles are merged.
BEGIN;

ALTER TABLE public.vendor_event_applications ADD COLUMN IF NOT EXISTS additional_notes text;

-- Never trust a submitted email or mutable user_metadata as proof of ownership.
CREATE OR REPLACE FUNCTION public.vendor_verified_email() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT lower(btrim(email)) FROM auth.users
  WHERE id = auth.uid() AND email_confirmed_at IS NOT NULL
    AND lower(btrim(email)) = lower(btrim(auth.jwt()->>'email'))
    -- Production permits auto-confirmed password signups. A confirmed_at value
    -- alone therefore is NOT proof that the person controls this mailbox.
    AND EXISTS (SELECT 1 FROM jsonb_array_elements(coalesce(auth.jwt()->'amr','[]'::jsonb)) method
      WHERE method->>'method' IN ('magiclink','email/signup'));
$$;
REVOKE ALL ON FUNCTION public.vendor_verified_email() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vendor_verified_email() TO authenticated;
-- Private profile reads are provided only through the scoped RPC above.
DROP POLICY IF EXISTS "Vendors can view their own applications" ON public.vendors;

CREATE OR REPLACE FUNCTION public.my_vendor_profiles() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE verified_email text := public.vendor_verified_email(); result jsonb;
BEGIN
  IF verified_email IS NULL THEN RAISE EXCEPTION 'Verify your email first.' USING ERRCODE = '42501'; END IF;
  WITH owned AS (
    SELECT v.*, lower(regexp_replace(btrim(v.business_name), '[[:space:]]+', ' ', 'g')) AS identity_name
    FROM public.vendors v WHERE lower(btrim(v.email)) = verified_email
  ), canonical AS (
    SELECT DISTINCT ON (identity_name) * FROM owned
    ORDER BY identity_name, applied_at ASC NULLS LAST, id
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id, 'business_name', c.business_name, 'contact_name', c.contact_name,
    'logo_url', c.logo_url, 'duplicate_count', (SELECT count(*) FROM owned o WHERE o.identity_name = c.identity_name),
    'applications', coalesce((SELECT jsonb_agg(jsonb_build_object('event_id', a.event_id, 'status', a.application_status))
      FROM public.vendor_event_applications a JOIN owned o ON a.vendor_id = o.id
      WHERE o.identity_name = c.identity_name), '[]'::jsonb)
  ) ORDER BY c.business_name), '[]'::jsonb) INTO result FROM canonical c;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.my_vendor_profiles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_vendor_profiles() TO authenticated;

-- A durable receipt record is committed in the same transaction as applications.
CREATE TABLE public.vendor_application_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  email text NOT NULL,
  business_name text NOT NULL,
  contact_name text NOT NULL,
  events jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent','failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  attempted_at timestamptz,
  sent_at timestamptz,
  claim_token uuid,
  attempts integer NOT NULL DEFAULT 0,
  provider_id text
);
CREATE INDEX vendor_application_receipts_vendor_status ON public.vendor_application_receipts(vendor_id,status);
ALTER TABLE public.vendor_event_applications ADD COLUMN application_receipt_id uuid REFERENCES public.vendor_application_receipts(id) ON DELETE SET NULL;
ALTER TABLE public.vendor_application_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.vendor_application_receipts FROM anon, authenticated;
CREATE POLICY "Admins can inspect application receipts" ON public.vendor_application_receipts
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));
GRANT SELECT ON public.vendor_application_receipts TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_returning_vendor(
  p_vendor_id uuid, p_event_ids uuid[], p_tables_requested text,
  p_power_requirements text, p_additional_notes text, p_agreement boolean
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  verified_email text := public.vendor_verified_email();
  profile public.vendors%ROWTYPE;
  identity_name text;
  profile_ids uuid[];
  event_record record;
  existing_statuses text[];
  inserted_ids uuid[] := '{}';
  outcomes jsonb := '[]';
  pending_receipts jsonb;
  receipt_id uuid;
BEGIN
  IF verified_email IS NULL THEN RAISE EXCEPTION 'Verify your email first.' USING ERRCODE = '42501'; END IF;
  IF p_agreement IS DISTINCT FROM true OR p_tables_requested IS NULL OR p_tables_requested NOT IN ('1','2','3','4','5+')
    OR coalesce(p_power_requirements,'') NOT IN ('','none','standard','multiple','heavy')
    OR length(coalesce(p_additional_notes,'')) > 2000
    OR coalesce(cardinality(p_event_ids),0) NOT BETWEEN 1 AND 50
    OR cardinality(p_event_ids) <> (SELECT count(DISTINCT x) FROM unnest(p_event_ids) x)
  THEN RAISE EXCEPTION 'Check your event requirements and agreement.' USING ERRCODE = '22023'; END IF;

  SELECT * INTO profile FROM public.vendors WHERE id = p_vendor_id AND lower(btrim(email)) = verified_email;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile unavailable for this verified email.' USING ERRCODE = '42501'; END IF;
  identity_name := lower(regexp_replace(btrim(profile.business_name), '[[:space:]]+', ' ', 'g'));
  -- Same lock order as new registrations, including legacy callers.
  PERFORM pg_advisory_xact_lock(hashtextextended('vendor-business:' || identity_name, 0));
  PERFORM pg_advisory_xact_lock(hashtextextended('vendor-email:' || verified_email, 0));
  SELECT array_agg(id ORDER BY applied_at ASC NULLS LAST, id) INTO profile_ids
  FROM public.vendors WHERE lower(btrim(email)) = verified_email
    AND lower(regexp_replace(btrim(business_name), '[[:space:]]+', ' ', 'g')) = identity_name;
  SELECT * INTO profile FROM public.vendors WHERE id = profile_ids[1];

  -- Lock event eligibility until the transaction finishes.
  PERFORM id FROM public.events WHERE id = ANY(p_event_ids) ORDER BY id FOR SHARE;
  IF (SELECT count(*) FROM public.events WHERE id = ANY(p_event_ids)) <> cardinality(p_event_ids)
  THEN RAISE EXCEPTION 'Selected event unavailable.' USING ERRCODE = '22023'; END IF;

  FOR event_record IN SELECT * FROM public.events WHERE id = ANY(p_event_ids) ORDER BY event_date, id LOOP
    SELECT array_agg(DISTINCT application_status ORDER BY application_status) INTO existing_statuses
    FROM public.vendor_event_applications WHERE vendor_id = ANY(profile_ids) AND event_id = event_record.id;
    IF cardinality(existing_statuses) > 0 THEN
      outcomes := outcomes || jsonb_build_array(jsonb_build_object('event_id', event_record.id, 'title', event_record.title,
        'outcome', 'existing', 'status', CASE WHEN cardinality(existing_statuses) = 1 THEN existing_statuses[1] ELSE 'needs_review' END));
    ELSIF event_record.status <> 'upcoming' OR event_record.event_date < (CURRENT_TIMESTAMP AT TIME ZONE 'Australia/Melbourne')::date THEN
      outcomes := outcomes || jsonb_build_array(jsonb_build_object('event_id', event_record.id, 'title', event_record.title,
        'outcome', 'unavailable', 'status', 'unavailable'));
    ELSE
      INSERT INTO public.vendor_event_applications(vendor_id,event_id,application_status,tables_requested,power_requirements,additional_notes)
      VALUES(profile.id,event_record.id,'pending',p_tables_requested,nullif(p_power_requirements,''),nullif(btrim(p_additional_notes),''));
      inserted_ids := array_append(inserted_ids,event_record.id);
      outcomes := outcomes || jsonb_build_array(jsonb_build_object('event_id', event_record.id, 'title', event_record.title,
        'outcome', 'created', 'status', 'pending'));
    END IF;
  END LOOP;
  IF cardinality(inserted_ids) > 0 THEN
    INSERT INTO public.vendor_application_receipts(vendor_id,email,business_name,contact_name,events)
    SELECT profile.id,verified_email,profile.business_name,profile.contact_name,
      jsonb_agg(jsonb_build_object('id',id,'title',title) ORDER BY id)
    FROM public.events WHERE id = ANY(inserted_ids) RETURNING id INTO receipt_id;
    UPDATE public.vendor_event_applications SET application_receipt_id=receipt_id
    WHERE vendor_id=profile.id AND event_id=ANY(inserted_ids);
  END IF;
  SELECT coalesce(jsonb_agg(id ORDER BY created_at),'[]'::jsonb) INTO pending_receipts
  FROM public.vendor_application_receipts WHERE vendor_id = ANY(profile_ids) AND email = verified_email AND status <> 'sent';
  RETURN jsonb_build_object('vendor_id',profile.id,'outcomes',outcomes,'receipt_ids',pending_receipts);
END;
$$;
REVOKE ALL ON FUNCTION public.submit_returning_vendor(uuid,uuid[],text,text,text,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_returning_vendor(uuid,uuid[],text,text,text,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_vendor_application_receipt(p_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE receipt public.vendor_application_receipts%ROWTYPE;
BEGIN
  UPDATE public.vendor_application_receipts SET status='sending', attempted_at=now(), attempts=attempts+1, claim_token=gen_random_uuid()
  WHERE id=p_id AND email=public.vendor_verified_email() AND status <> 'sent'
    AND (attempted_at IS NULL OR attempted_at < now() - interval '2 minutes')
    -- Resend idempotency lasts 24h. Older uncertain attempts need admin review.
    AND created_at > now() - interval '23 hours'
  RETURNING * INTO receipt;
  RETURN CASE WHEN receipt.id IS NULL THEN NULL ELSE to_jsonb(receipt) END;
END;
$$;
CREATE OR REPLACE FUNCTION public.finish_vendor_application_receipt(p_id uuid,p_claim_token uuid,p_provider_id text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.vendor_application_receipts SET status=CASE WHEN p_provider_id IS NULL THEN 'failed' ELSE 'sent' END,
    sent_at=CASE WHEN p_provider_id IS NULL THEN NULL ELSE now() END, provider_id=p_provider_id
  WHERE id=p_id AND claim_token=p_claim_token AND email=public.vendor_verified_email() AND status='sending';
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_vendor_application_receipt(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.finish_vendor_application_receipt(uuid,uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_vendor_application_receipt(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finish_vendor_application_receipt(uuid,uuid,text) TO authenticated;

-- Retain the proven new-registration implementation, but close the anonymous
-- existing-profile path. The wrapper locks before checking to prevent races.
ALTER FUNCTION public.submit_vendor_with_events(uuid,text,text,text,text,text,text,text[],text,text,text,text,text,uuid[])
  RENAME TO register_new_vendor_internal;
REVOKE ALL ON FUNCTION public.register_new_vendor_internal(uuid,text,text,text,text,text,text,text[],text,text,text,text,text,uuid[]) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.submit_vendor_with_events(
  p_vendor_id uuid,p_business_name text,p_contact_name text,p_email text,p_phone text,p_location_state text,
  p_description text,p_categories text[],p_logo_url text,p_social_links text,p_tables_requested text,
  p_power_requirements text,p_additional_notes text,p_event_ids uuid[]
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE identity_name text := lower(regexp_replace(btrim(p_business_name),'[[:space:]]+',' ','g'));
  normalized_email text := lower(btrim(p_email)); result jsonb;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('vendor-business:' || identity_name,0));
  PERFORM pg_advisory_xact_lock(hashtextextended('vendor-email:' || normalized_email,0));
  IF EXISTS(SELECT 1 FROM public.vendors WHERE lower(btrim(email))=normalized_email
    OR lower(regexp_replace(btrim(business_name),'[[:space:]]+',' ','g'))=identity_name)
  THEN RAISE EXCEPTION 'Use returning vendor email verification or contact support.' USING ERRCODE='23505'; END IF;
  result := public.register_new_vendor_internal(p_vendor_id,p_business_name,p_contact_name,normalized_email,p_phone,p_location_state,
    p_description,p_categories,p_logo_url,p_social_links,p_tables_requested,p_power_requirements,p_additional_notes,p_event_ids);
  UPDATE public.vendor_event_applications SET additional_notes=nullif(btrim(p_additional_notes),'')
  WHERE vendor_id=(result->>'vendor_id')::uuid AND event_id=ANY(p_event_ids);
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_vendor_with_events(uuid,text,text,text,text,text,text,text[],text,text,text,text,text,uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_vendor_with_events(uuid,text,text,text,text,text,text,text[],text,text,text,text,text,uuid[]) TO anon,authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
