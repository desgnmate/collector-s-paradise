// Local-only Supabase/Resend transport fixture. Uses the real migration SQL.
// Never imports .env.local and never contacts production or sends real mail.
import http from 'node:http';
import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createTestDatabase, ids, asUser } from './returning-vendor-db.mjs';

async function createRegistrationDatabase() {
  const database = await createTestDatabase();
  await database.exec(`ALTER TABLE vendor_event_applications ADD COLUMN booth_assignment text;
    GRANT USAGE ON SCHEMA auth TO anon,authenticated;
    GRANT SELECT ON admin_users TO authenticated;`);
  await database.exec(await readFile(new URL('../../supabase/migrations/20260928000000_vendor_directory_registrations.sql',import.meta.url),'utf8'));
  return database;
}
let db = await createRegistrationDatabase();
let mails = [];
let links = new Map();
let sent = new Map();
let mode = {};
let removedLogos=[];
const user = { id: ids.owner, email: 'owner@example.test', aud: 'authenticated', role: 'authenticated',
  email_confirmed_at: new Date().toISOString(), app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
const jwt = [Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),
  Buffer.from(JSON.stringify({sub:ids.owner,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url'),'test-signature'].join('.');
const functions = {
  get_public_vendor_directory: ['p_event_id','p_unassigned_only','p_offset','p_limit'],
  review_vendor_registration: ['p_request_id','p_vendor_id','p_decline'],
  remove_vendor_directory_approval: ['p_vendor_id'],
  vendor_directory_registration_available: [],
  submit_vendor_registration: ['p_vendor_id','p_business_name','p_contact_name','p_email','p_phone','p_location_state','p_description','p_categories','p_logo_url','p_social_links','p_tables_requested','p_power_requirements','p_additional_notes','p_event_ids'],
  my_vendor_profiles: [], submit_returning_vendor: ['p_vendor_id','p_event_ids','p_tables_requested','p_power_requirements','p_additional_notes','p_agreement'],
  claim_vendor_application_receipt: ['p_id'], finish_vendor_application_receipt: ['p_id','p_claim_token','p_provider_id'],
};
const server = http.createServer(async (req,res) => {
  const url = new URL(req.url,'http://127.0.0.1:4319');
  const chunks=[]; for await(const chunk of req) chunks.push(chunk);
  const body=chunks.length && req.headers['content-type']?.includes('application/json') ? JSON.parse(Buffer.concat(chunks).toString()) : {};
  const reply=(value,status=200) => {res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};
  try {
    if(url.pathname==='/health') return reply({ok:true});
    if(url.pathname==='/test/reset') { await db.close();db=await createRegistrationDatabase();mails=[];links=new Map();sent=new Map();mode={};removedLogos=[];return reply({ok:true}); }
    if(url.pathname==='/test/mode') {
      mode={...mode,...body};
      if(body.adminUser) await db.query('INSERT INTO admin_users(user_id) VALUES($1)',[ids.owner]);
      return reply({ok:true});
    }
    if(url.pathname==='/test/state') return reply({mails,sent:[...sent.entries()],removedLogos,
      registrations:(await db.query('SELECT * FROM vendor_registration_requests')).rows,
      vendors:(await db.query('SELECT * FROM vendors')).rows,
      applications:(await db.query('SELECT * FROM vendor_event_applications')).rows,
      receipts:(await db.query('SELECT * FROM vendor_application_receipts')).rows});
    if(url.pathname==='/auth/v1/otp') {
      if(mode.authFailure) return reply({code:'over_email_send_rate_limit',msg:'Rate limited'},429);
      const code=randomUUID();links.set(code,body.code_challenge);
      mails.push({to:body.email,url:`${url.searchParams.get('redirect_to')}?code=${code}`});
      return reply({});
    }
    if(url.pathname==='/auth/v1/token') {
      const challenge=createHash('sha256').update(body.code_verifier || '').digest('base64url');
      if(!links.has(body.auth_code) || links.get(body.auth_code)!==challenge) return reply({error:'invalid_grant',error_description:'Invalid or expired link'},400);
      links.delete(body.auth_code);
      return reply({access_token:jwt,refresh_token:'test-refresh',expires_in:3600,token_type:'bearer',user});
    }
    if(url.pathname==='/auth/v1/user') return req.headers.authorization===`Bearer ${jwt}` ? reply(user) : reply({message:'Invalid token'},401);
    if(url.pathname==='/auth/v1/logout') return reply({});
    if(url.pathname==='/emails') {
      if(mode.emailFailure) return reply({name:'application_error',message:'Simulated provider failure'},500);
      const key=req.headers['idempotency-key'];
      if(!sent.has(key)) sent.set(key,{id:randomUUID(),to:body.to,subject:body.subject});
      return reply({id:sent.get(key).id});
    }
    if(url.pathname.startsWith('/storage/v1/object/')) {
      if(req.method==='DELETE') removedLogos.push(body);
      return mode.uploadFailure ? reply({message:'Simulated upload failure'},500) : reply({Key:url.pathname});
    }
    if(url.pathname==='/rest/v1/admin_users') return reply(mode.adminUser?[{id:ids.owner,user_id:ids.owner}]:[]);
    if(url.pathname==='/rest/v1/vendor_registration_requests') return reply((await db.query("SELECT * FROM vendor_registration_requests WHERE status='pending' ORDER BY created_at")).rows);
    if(url.pathname==='/rest/v1/vendors') {
      let rows=(await db.query('SELECT * FROM vendors')).rows;
      if(url.searchParams.get('directory_approved')) rows=rows.filter(v=>v.directory_approved);
      return reply(rows.map(v=>({...v,categories:v.categories||[],application_status:v.application_status||'pending'})));
    }
    if(url.pathname==='/rest/v1/vendor_event_applications') return reply((await db.query('SELECT a.*,row_to_json(e) AS events FROM vendor_event_applications a JOIN events e ON e.id=a.event_id')).rows);
    if(url.pathname==='/rest/v1/events') {
      if(process.env.DEBUG_VENDOR_FIXTURE) console.log('events filter',url.searchParams.toString());
      const selected=url.searchParams.get('id')?.replace(/^in\.\(/,'').replace(/\)$/,'').split(',').map(id=>id.replaceAll('"',''));
      return reply((await db.query("SELECT id,title,event_date::text,venue,status FROM events WHERE status='upcoming' ORDER BY event_date,id")).rows.filter(e=>!selected || selected.includes(e.id)).map(event=>({...event,start_time:'10:00:00',end_time:'17:00:00',description:'Test event',cover_image_url:null,ticket_price:10,capacity:100,tickets_sold:0,booking_link:null})));
    }
    if(url.pathname.startsWith('/rest/v1/rpc/')) {
      const name=url.pathname.split('/').pop();
      if(mode.migrationMissing && name==='vendor_directory_registration_available') return reply({code:'PGRST202',message:'Missing function'},404);
      if(!Object.hasOwn(functions,name)) return reply([]);
      if(mode.saveFailure && name==='submit_returning_vendor') {mode.saveFailure=false;return reply({code:'08006',message:'Simulated connection failure'},503);}
      const owner=req.headers.authorization===`Bearer ${jwt}` ? ids.owner : null;
      const args=functions[name];
      const result=await asUser(db,owner,tx => tx.query(`SELECT public.${name}(${args.map((_,i)=>`$${i+1}`).join(',')}) AS result`,args.map(key=>body[key])),owner?'authenticated':'anon');
      if(mode.registrationLostResponse && name==='submit_vendor_registration') { mode.registrationLostResponse=false;return reply({code:'08006',message:'Connection lost after commit'},503); }
      if(mode.lostResponse && name==='submit_returning_vendor') {mode.lostResponse=false;return reply({code:'08006',message:'Simulated lost response after commit'},503);}
      return reply(result.rows[0].result);
    }
    if(url.pathname.startsWith('/rest/v1/')) return reply([]);
    return reply({error:'Unknown fixture endpoint'},404);
  } catch(error) { return reply({code:error.code || 'fixture_error',message:error.message},400); }
});
server.listen(4319,'127.0.0.1',()=>console.log('Isolated database/email fixture on 4319'));
