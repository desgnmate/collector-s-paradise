import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createTestDatabase, ids, submit } from './fixtures/returning-vendor-db.mjs';

const migrationUrl = new URL('../supabase/migrations/20261112000000_vendor_application_closure.sql', import.meta.url);
let db;
before(async () => {
  db = await createTestDatabase();
  await db.exec('GRANT USAGE ON SCHEMA auth TO anon,authenticated; GRANT INSERT ON vendor_event_applications TO authenticated;');
  await db.exec(await readFile(migrationUrl, 'utf8'));
});
after(async () => { await db?.close(); });

// Production requests always carry a role claim; the trigger depends on it.
function withJwt(role, callback, userId = '') {
  return db.transaction(async tx => {
    await tx.query("SELECT set_config('request.jwt.claim.sub',$1,true)", [userId]);
    await tx.query("SELECT set_config('request.jwt.claims',$1,true)",
      [JSON.stringify({ role, email: 'owner@example.test', amr: [{ method: 'magiclink' }] })]);
    if (role !== 'service_role') await tx.exec(`SET LOCAL ROLE ${role}`);
    return callback(tx);
  });
}
const registerNewVendor = (email, eventId = ids.next) => withJwt('anon', tx => tx.query(
  `SELECT public.submit_vendor_with_events($1,$2,'New Contact',$3,'123','Victoria',
    'A detailed business description',ARRAY['Cards'],'https://example.test/logo.png','https://example.test',
    '1','none','',$4) AS result`, [randomUUID(), `Business ${email}`, email, [eventId]]));
const setClosed = (eventId, closed) => db.query(
  `UPDATE events SET vendor_applications_closed_at=${closed ? 'now()' : 'NULL'} WHERE id=$1`, [eventId]);
const applicationCount = async eventId => (await db.query(
  'SELECT count(*)::int n FROM vendor_event_applications WHERE event_id=$1', [eventId])).rows[0].n;

test('migration can be applied more than once', async () => {
  await db.exec(await readFile(migrationUrl, 'utf8'));
});

test('open events keep accepting new and returning vendor applications', async () => {
  const created = (await registerNewVendor('open@example.test')).rows[0].result;
  assert.deepEqual(created.inserted_event_ids, [ids.next]);
  const returning = await withJwt('authenticated', tx => submit(tx, [ids.next]), ids.owner);
  assert.equal(returning.outcomes[0].outcome, 'created');
});

test('a closed event rejects every public submission path and saves nothing', async () => {
  await setClosed(ids.next, true);
  const before = await applicationCount(ids.next);

  await assert.rejects(registerNewVendor('late@example.test'), /applications are closed/);
  assert.equal((await db.query("SELECT 1 FROM vendors WHERE email='late@example.test'")).rows.length, 0);
  await assert.rejects(
    withJwt('authenticated', tx => submit(tx, [ids.next], ids.secondBusiness), ids.owner),
    /applications are closed/,
  );
  // A signed-in admin session (review queue) is blocked too.
  await assert.rejects(withJwt('authenticated', tx => tx.query(
    "INSERT INTO vendor_event_applications(vendor_id,event_id,application_status) VALUES($1,$2,'pending')",
    [ids.otherVendor, ids.next]), ids.other), /applications are closed/);

  assert.equal(await applicationCount(ids.next), before);
  // Other events are unaffected.
  const elsewhere = (await registerNewVendor('elsewhere@example.test', ids.pending)).rows[0].result;
  assert.deepEqual(elsewhere.inserted_event_ids, [ids.pending]);
});

test('the admin service client can still place a vendor after closing', async () => {
  await withJwt('service_role', tx => tx.query(
    "INSERT INTO vendor_event_applications(vendor_id,event_id,application_status) VALUES($1,$2,'approved')",
    [ids.otherVendor, ids.next]));
  assert.equal((await db.query(
    'SELECT application_status FROM vendor_event_applications WHERE vendor_id=$1 AND event_id=$2',
    [ids.otherVendor, ids.next])).rows[0].application_status, 'approved');
});

test('the public form can read the closed flag, and notice states are constrained', async () => {
  const open = await withJwt('anon', tx => tx.query(
    'SELECT count(*)::int n FROM events WHERE vendor_applications_closed_at IS NULL'));
  assert.equal(open.rows[0].n, 5);
  await db.query(
    "UPDATE vendor_event_applications SET application_status='rejected',closure_notice_status='pending' WHERE event_id=$1 AND application_status='pending'",
    [ids.next]);
  await assert.rejects(
    db.query("UPDATE vendor_event_applications SET closure_notice_status='emailed' WHERE event_id=$1", [ids.next]),
    /closure_notice_status_check/,
  );
});

test('reopening accepts applications again', async () => {
  await setClosed(ids.next, false);
  const created = (await registerNewVendor('reopened@example.test')).rows[0].result;
  assert.deepEqual(created.inserted_event_ids, [ids.next]);
});
