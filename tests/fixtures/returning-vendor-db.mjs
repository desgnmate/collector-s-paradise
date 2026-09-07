import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';

export const ids = {
  owner: '10000000-0000-4000-8000-000000000001', other: '10000000-0000-4000-8000-000000000002',
  vendor: '20000000-0000-4000-8000-000000000001', duplicate: '20000000-0000-4000-8000-000000000002',
  otherVendor: '20000000-0000-4000-8000-000000000003', secondBusiness: '20000000-0000-4000-8000-000000000004',
  approved: '30000000-0000-4000-8000-000000000001', next: '30000000-0000-4000-8000-000000000002',
  declined: '30000000-0000-4000-8000-000000000003', waitlisted: '30000000-0000-4000-8000-000000000004',
  pending: '30000000-0000-4000-8000-000000000005', closed: '30000000-0000-4000-8000-000000000006',
};

export async function createTestDatabase() {
  const db = new PGlite();
  // Minimal production-shaped tables; all behavior under test comes from the
  // checked-in deployment migrations, not a JavaScript copy of the algorithm.
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS
      $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    CREATE TABLE public.admin_users(id uuid DEFAULT gen_random_uuid(),user_id uuid);
    CREATE TABLE public.vendors (
      id uuid PRIMARY KEY,business_name text NOT NULL,contact_name text NOT NULL,email text NOT NULL,
      phone text,location_state text,description text,categories text[],logo_url text,social_links text,
      tables_requested text,power_requirements text,additional_notes text,application_status text,
      event_id uuid,applied_at timestamptz DEFAULT now()
    );
    CREATE TABLE public.events(id uuid PRIMARY KEY,title text,event_date date,status text,venue text);
    CREATE TABLE public.vendor_event_applications(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),vendor_id uuid REFERENCES vendors(id),event_id uuid REFERENCES events(id),
      application_status text CHECK(application_status IN ('pending','approved','rejected','waitlisted')),
      tables_requested text,power_requirements text,approved_vendor_fee numeric,invitation_status text,
      applied_at timestamptz DEFAULT now(),UNIQUE(vendor_id,event_id)
    );
    INSERT INTO auth.users VALUES('${ids.owner}','owner@example.test',now()),('${ids.other}','other@example.test',now());
    INSERT INTO vendors(id,business_name,contact_name,email,logo_url,applied_at) VALUES
      ('${ids.vendor}','Card Co.','Owner',' OWNER@example.test ','https://example.test/logo.png','2025-01-01'),
      ('${ids.duplicate}','  CARD   CO. ','Owner','owner@example.test','https://example.test/old.png','2025-02-01'),
      ('${ids.otherVendor}','Other Co.','Other','other@example.test','https://example.test/other.png','2025-01-01'),
      ('${ids.secondBusiness}','Second Business','Owner','owner@example.test','https://example.test/second.png','2025-01-01');
    INSERT INTO events VALUES
      ('${ids.approved}','Approved Event',current_date+30,'upcoming','Melbourne'),
      ('${ids.next}','New Event',current_date+60,'upcoming','Canberra'),
      ('${ids.declined}','Declined Event',current_date+40,'upcoming','Melbourne'),
      ('${ids.waitlisted}','Waitlisted Event',current_date+40,'upcoming','Melbourne'),
      ('${ids.pending}','Pending Event',current_date+40,'upcoming','Melbourne'),
      ('${ids.closed}','Closed Event',current_date-1,'completed','Melbourne');
    INSERT INTO vendor_event_applications(vendor_id,event_id,application_status,tables_requested,approved_vendor_fee,invitation_status) VALUES
      ('${ids.duplicate}','${ids.approved}','approved','2',125,'sent'),
      ('${ids.vendor}','${ids.declined}','rejected','1',null,null),
      ('${ids.vendor}','${ids.waitlisted}','waitlisted','1',null,null),
      ('${ids.vendor}','${ids.pending}','pending','1',null,null);
  `);
  for (const migration of ['20260831000000_harden_vendor_reapplications.sql','20260907000000_verified_vendor_reapplications.sql']) {
    await db.exec(await readFile(new URL(`../../supabase/migrations/${migration}`, import.meta.url), 'utf8'));
  }
  return db;
}

export async function asUser(db, userId, callback, role = 'authenticated', method = 'magiclink') {
  return db.transaction(async tx => {
    await tx.query("SELECT set_config('request.jwt.claim.sub',$1,true)", [userId || '']);
    await tx.query("SELECT set_config('request.jwt.claims',$1,true)", [JSON.stringify({email:userId === ids.owner ? 'owner@example.test' : 'other@example.test',amr:[{method}]})]);
    await tx.exec(`SET LOCAL ROLE ${role === 'anon' ? 'anon' : 'authenticated'}`);
    return callback(tx);
  });
}

export async function submit(tx, events = [ids.next], vendor = ids.vendor, notes = 'Accessible setup please') {
  const { rows } = await tx.query('SELECT public.submit_returning_vendor($1,$2,$3,$4,$5,$6) AS result',
    [vendor, events, '2', 'standard', notes, true]);
  return rows[0].result;
}
