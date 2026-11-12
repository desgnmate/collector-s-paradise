import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createTestDatabase, asUser, ids } from './fixtures/returning-vendor-db.mjs';

let db;
before(async () => {
  db = await createTestDatabase();
  await db.exec(`ALTER TABLE vendor_event_applications ADD COLUMN booth_assignment text;
    GRANT USAGE ON SCHEMA auth TO anon,authenticated;
    GRANT SELECT ON admin_users TO authenticated;
    INSERT INTO admin_users(user_id) VALUES ('${ids.other}');`);
  await db.exec(await readFile(new URL('../supabase/migrations/20260928000000_vendor_directory_registrations.sql', import.meta.url), 'utf8'));
});
after(async () => { await db?.close(); });

async function register({ name='Directory Business', email='directory@example.test', events=[], tables='' }={}) {
  const id=randomUUID();
  const result=await asUser(db,null, tx=>tx.query(`SELECT public.submit_vendor_registration(
    $1,$2,'Submitted Contact',$3,'123','Victoria','A detailed business description',ARRAY['Cards'],
    'https://example.test/new-logo.png','https://example.test',$4,'none','Submitted notes',$5) AS result`,[id,name,email,tables,events]),'anon');
  return result.rows[0].result;
}
const review=(id,vendor=null,decline=false,user=ids.other)=>asUser(db,user,tx=>tx.query(
  'SELECT public.review_vendor_registration($1,$2,$3) AS id',[id,vendor,decline]));
const directory=async(event=null)=> (await asUser(db,null,tx=>tx.query(
  'SELECT * FROM get_public_vendor_directory($1,true,0,48)',[event]),'anon')).rows;

test('directory request stays private, creates no vendor or event record until admin approval',async()=>{
  const r=await register();
  assert.ok(r.review_request_id);
  assert.deepEqual(Object.keys(r),['review_request_id']);
  assert.equal((await directory()).some(v=>v.business_name==='Directory Business'),false);
  await assert.rejects(asUser(db,null,tx=>tx.query('SELECT * FROM vendor_registration_requests'),'anon'),/permission denied/);
  assert.equal((await asUser(db,ids.owner,tx=>tx.query('SELECT * FROM vendor_registration_requests'))).rows.length,0);
  await assert.rejects(review(r.review_request_id,null,false,ids.owner),/Admin access required/);
  const approved=(await review(r.review_request_id)).rows[0].id;
  assert.ok((await directory()).some(v=>v.id===approved));
  assert.equal((await db.query('SELECT * FROM vendor_event_applications WHERE vendor_id=$1',[approved])).rows.length,0);
  assert.equal((await directory(ids.next)).some(v=>v.id===approved),false);
  await assert.rejects(review(r.review_request_id),/already reviewed/);
});

test('later event submission is held for review and never overwrites saved identity',async()=>{
  const vendor=(await db.query("SELECT * FROM vendors WHERE email='directory@example.test'")).rows[0];
  const r=await register({events:[ids.next],tables:'2'});
  assert.ok(r.review_request_id);
  assert.equal((await db.query('SELECT count(*)::int n FROM vendor_event_applications WHERE vendor_id=$1',[vendor.id])).rows[0].n,0);
  await review(r.review_request_id,vendor.id);
  const application=(await db.query('SELECT * FROM vendor_event_applications WHERE vendor_id=$1',[vendor.id])).rows[0];
  assert.equal(application.application_status,'pending');
  assert.equal(application.tables_requested,'2');
  assert.deepEqual((await db.query('SELECT * FROM vendors WHERE id=$1',[vendor.id])).rows[0],vendor);
  assert.ok((await directory()).some(v=>v.id===vendor.id));
  assert.equal((await directory(ids.next)).some(v=>v.id===vendor.id),false);
});

test('spoofing an existing email cannot modify the profile or approved/rejected decisions',async()=>{
  const before=(await db.query('SELECT * FROM vendors WHERE id=$1',[ids.vendor])).rows[0];
  const r=await register({name:'Card Co.',email:'owner@example.test',events:[ids.declined],tables:'4'});
  assert.ok(r.review_request_id);
  assert.deepEqual((await db.query('SELECT * FROM vendors WHERE id=$1',[ids.vendor])).rows[0],before);
  await assert.rejects(review(r.review_request_id),/Possible existing vendor/);
  await review(r.review_request_id,ids.vendor);
  assert.equal((await db.query('SELECT application_status FROM vendor_event_applications WHERE vendor_id=$1 AND event_id=$2',[ids.vendor,ids.declined])).rows[0].application_status,'rejected');
});

test('new event applicant keeps the established event registration path',async()=>{
  const r=await register({name:'New Event Business',email:'event-new@example.test',events:[ids.next],tables:'1'});
  assert.ok(r.vendor_id);
  assert.equal(r.review_request_id,undefined);
  assert.deepEqual(r.inserted_event_ids,[ids.next]);
});

test('invalid and subsequently closed events cannot create pending applications',async()=>{
  await assert.rejects(register({events:[ids.closed],tables:'1'}),/unavailable/);
  await assert.rejects(register({events:[ids.next],tables:''}),/table requirements/);
  const r=await register({events:[ids.next],tables:'1'});
  await db.query("UPDATE events SET status='cancelled' WHERE id=$1",[ids.next]);
  await assert.rejects(review(r.review_request_id,ids.vendor),/unavailable/);
  assert.equal((await db.query('SELECT status FROM vendor_registration_requests WHERE id=$1',[r.review_request_id])).rows[0].status,'pending');
  await review(r.review_request_id,null,true);
  assert.equal((await db.query('SELECT status FROM vendor_registration_requests WHERE id=$1',[r.review_request_id])).rows[0].status,'declined');
});

test('directory approval can be removed without changing event decisions',async()=>{
  const r=await register({name:'Removable Directory',email:'remove@example.test'});
  const vendor=(await review(r.review_request_id)).rows[0].id;
  assert.ok((await directory()).some(v=>v.id===vendor));
  await assert.rejects(asUser(db,ids.owner,tx=>tx.query('SELECT remove_vendor_directory_approval($1)',[vendor])),/Admin access required/);
  await asUser(db,ids.other,tx=>tx.query('SELECT remove_vendor_directory_approval($1)',[vendor]));
  assert.equal((await directory()).some(v=>v.id===vendor),false);
  const existing=await register({name:'Card Co.',email:'owner@example.test'});
  await review(existing.review_request_id,ids.duplicate);
  await asUser(db,ids.other,tx=>tx.query('SELECT remove_vendor_directory_approval($1)',[ids.duplicate]));
  assert.ok((await directory(ids.approved)).some(v=>v.id===ids.duplicate));
});
