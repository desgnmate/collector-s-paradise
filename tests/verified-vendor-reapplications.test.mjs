import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase, ids, asUser, submit } from './fixtures/returning-vendor-db.mjs';
import { returningRequirementsSchema, returningResultSchema, applicationStatusText } from '../lib/returning-vendors.ts';

let db;
before(async () => { db = await createTestDatabase(); });
after(async () => { await db?.close(); });

test('anonymous callers cannot read profiles or use returning RPC', async () => {
  await assert.rejects(asUser(db, null, tx => tx.query('SELECT public.my_vendor_profiles()'), 'anon'), /permission denied/);
  await assert.rejects(asUser(db, null, tx => submit(tx), 'anon'), /permission denied/);
});
test('authenticated callers need a confirmed email and cannot choose another owner', async () => {
  await assert.rejects(asUser(db, ids.owner, tx => submit(tx), 'authenticated', 'password'), /Verify your email/);
  await assert.rejects(asUser(db, ids.other, tx => submit(tx)), /Profile unavailable/);
  await assert.rejects(asUser(db, null, tx => submit(tx)), /Verify your email/);
  await db.query('UPDATE auth.users SET email_confirmed_at=null WHERE id=$1', [ids.other]);
  await assert.rejects(asUser(db, ids.other, tx => submit(tx, [ids.next], ids.otherVendor)), /Verify your email/);
  await db.query('UPDATE auth.users SET email_confirmed_at=now() WHERE id=$1', [ids.other]);
});
test('verified email finds canonical profiles, including multiple businesses, without retyping names', async () => {
  const result = await asUser(db, ids.owner, tx => tx.query('SELECT public.my_vendor_profiles() AS profiles'));
  assert.equal(result.rows[0].profiles.length, 2);
  const profile = result.rows[0].profiles.find(x => x.id === ids.vendor);
  assert.equal(profile.duplicate_count, 2);
  assert.ok(profile.applications.some(x => x.event_id === ids.approved && x.status === 'approved'));
  assert.ok(!result.rows[0].profiles.some(x => x.id === ids.otherVendor));
});
test('all existing statuses and duplicate-profile approvals are preserved in mixed submissions', async () => {
  const result = returningResultSchema.parse(await asUser(db, ids.owner, tx => submit(tx,
    [ids.next, ids.approved, ids.declined, ids.waitlisted, ids.pending, ids.closed])));
  for (const [id, status] of [[ids.approved,'approved'],[ids.declined,'rejected'],[ids.waitlisted,'waitlisted'],[ids.pending,'pending']]) {
    assert.deepEqual(result.outcomes.find(x => x.event_id === id)?.outcome, 'existing');
    assert.equal(result.outcomes.find(x => x.event_id === id)?.status, status);
  }
  assert.equal(result.outcomes.find(x => x.event_id === ids.next)?.outcome, 'created');
  assert.equal(result.outcomes.find(x => x.event_id === ids.closed)?.outcome, 'unavailable');
  assert.equal(result.receipt_ids.length, 1);
  const saved = (await db.query('SELECT * FROM vendor_event_applications WHERE event_id=$1', [ids.next])).rows;
  assert.equal(saved.length,1);
  assert.equal(saved[0].additional_notes,'Accessible setup please');
  assert.equal(saved[0].vendor_id,ids.vendor);
  const approved = (await db.query('SELECT * FROM vendor_event_applications WHERE event_id=$1', [ids.approved])).rows;
  assert.equal(approved.length,1);
  assert.equal(approved[0].approved_vendor_fee,'125');
  assert.equal(approved[0].invitation_status,'sent');
  assert.equal((await db.query('SELECT count(*)::int AS count FROM vendors')).rows[0].count,4);
});
test('retry and duplicate-row selection create neither applications nor receipt batches', async () => {
  const result = await asUser(db, ids.owner, tx => submit(tx, [ids.next,ids.approved], ids.duplicate, 'Do not overwrite notes'));
  assert.equal(result.vendor_id,ids.vendor);
  assert.ok(result.outcomes.every(x => x.outcome === 'existing'));
  assert.equal((await db.query('SELECT count(*)::int AS count FROM vendor_application_receipts')).rows[0].count,1);
  assert.equal((await db.query('SELECT additional_notes FROM vendor_event_applications WHERE event_id=$1',[ids.next])).rows[0].additional_notes,'Accessible setup please');
});
test('conflicting legacy decisions are reported without creating or changing applications', async () => {
  await db.query("INSERT INTO vendor_event_applications(vendor_id,event_id,application_status) VALUES($1,$2,'pending')",[ids.vendor,ids.approved]);
  const result = await asUser(db,ids.owner,tx => submit(tx,[ids.approved]));
  assert.equal(result.outcomes[0].status,'needs_review');
  assert.equal(result.outcomes[0].outcome,'existing');
});
test('receipt claims are owner-only, leased, retryable after failure, and terminal after success', async () => {
  const id = (await db.query('SELECT id FROM vendor_application_receipts')).rows[0].id;
  const claim = user => asUser(db,user,tx => tx.query('SELECT public.claim_vendor_application_receipt($1) AS receipt',[id]));
  assert.equal((await claim(ids.other)).rows[0].receipt,null);
  const first = (await claim(ids.owner)).rows[0].receipt;
  assert.equal(first.attempts,1);
  assert.equal((await claim(ids.owner)).rows[0].receipt,null);
  const finish = (token,provider) => asUser(db,ids.owner,tx => tx.query('SELECT public.finish_vendor_application_receipt($1,$2,$3) AS ok',[id,token,provider]));
  assert.equal((await finish(ids.vendor,'wrong')).rows[0].ok,false);
  assert.equal((await finish(first.claim_token,null)).rows[0].ok,true);
  await db.query("UPDATE vendor_application_receipts SET attempted_at=now()-interval '3 minutes' WHERE id=$1",[id]);
  const retry = (await claim(ids.owner)).rows[0].receipt;
  assert.equal(retry.id,first.id); // stable provider idempotency key
  assert.equal(retry.attempts,2);
  assert.equal((await finish(first.claim_token,'stale')).rows[0].ok,false);
  assert.equal((await finish(retry.claim_token,'email-id')).rows[0].ok,true);
  assert.equal((await claim(ids.owner)).rows[0].receipt,null);
  assert.deepEqual((await asUser(db,ids.owner,tx => submit(tx))).receipt_ids,[]);
});
test('legacy anonymous RPC cannot bypass email verification for an existing profile', async () => {
  await assert.rejects(asUser(db,null,tx => tx.query(`SELECT public.submit_vendor_with_events($1,'Card Co.','Owner','owner@example.test','','Victoria','A sufficiently long description',ARRAY['Cards'],'logo','https://example.test','1','','',$2)`,[ids.vendor,[ids.next]]),'anon'),/returning vendor email verification/);
  await assert.rejects(asUser(db,null,tx => tx.query(`SELECT public.register_new_vendor_internal($1,'Card Co.','Owner','owner@example.test','','Victoria','A sufficiently long description',ARRAY['Cards'],'logo','https://example.test','1','','',$2)`,[ids.vendor,[ids.next]]),'anon'),/permission denied/);
});
test('new registrations still work through the public wrapper and preserve notes', async () => {
  const id='20000000-0000-4000-8000-000000000099';
  await asUser(db,null,tx => tx.query(`SELECT public.submit_vendor_with_events($1,'New Business','New Person',' NEW@example.test ','','Victoria','A sufficiently long description',ARRAY['Cards'],'logo','https://example.test','1','','New notes',$2)`,[id,[ids.next]]),'anon');
  assert.equal((await db.query('SELECT email FROM vendors WHERE id=$1',[id])).rows[0].email,'new@example.test');
  assert.equal((await db.query('SELECT additional_notes FROM vendor_event_applications WHERE vendor_id=$1',[id])).rows[0].additional_notes,'New notes');
});
test('DB validates consent, requirements, missing/duplicate events and prevents partial inserts', async () => {
  const attempt = (events,agreement) => asUser(db,ids.owner,tx => tx.query('SELECT public.submit_returning_vendor($1,$2,$3,$4,$5,$6)',[ids.vendor,events,'2','none','',agreement]));
  await assert.rejects(attempt([ids.next],false),/requirements/);
  await assert.rejects(attempt([ids.next,ids.next],true),/requirements/);
  await assert.rejects(attempt([ids.next,ids.owner],true),/unavailable/);
});
test('validation does not require a logo or editable business identity', () => {
  const input={ vendor_id:ids.vendor,event_ids:[ids.next],tables_requested:'1',power_requirements:'',additional_notes:'',agreement:true };
  assert.equal(returningRequirementsSchema.safeParse(input).success,true);
  assert.equal(returningRequirementsSchema.safeParse({...input,agreement:false}).success,false);
  assert.equal(returningRequirementsSchema.safeParse({...input,additional_notes:'x'.repeat(2001)}).success,false);
  assert.match(applicationStatusText('rejected'),/reconsideration/);
  assert.throws(() => returningResultSchema.parse({vendor_id:ids.vendor}),/receipt_ids/);
});
