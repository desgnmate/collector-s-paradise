// Local-only Supabase/Resend transport fixture. Uses the real migration SQL.
// Never imports .env.local and never contacts production or sends real mail.
import http from 'node:http';
import { createHash, randomUUID } from 'node:crypto';
import { createTestDatabase, ids, asUser } from './returning-vendor-db.mjs';

let db = await createTestDatabase();
let mails = [];
let links = new Map();
let sent = new Map();
let mode = {};
const user = { id: ids.owner, email: 'owner@example.test', aud: 'authenticated', role: 'authenticated',
  email_confirmed_at: new Date().toISOString(), app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
const jwt = [Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),
  Buffer.from(JSON.stringify({sub:ids.owner,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url'),'test-signature'].join('.');
const functions = {
  my_vendor_profiles: [], submit_returning_vendor: ['p_vendor_id','p_event_ids','p_tables_requested','p_power_requirements','p_additional_notes','p_agreement'],
  claim_vendor_application_receipt: ['p_id'], finish_vendor_application_receipt: ['p_id','p_claim_token','p_provider_id'],
};
const server = http.createServer(async (req,res) => {
  const url = new URL(req.url,'http://127.0.0.1:4319');
  const chunks=[]; for await(const chunk of req) chunks.push(chunk);
  const body=chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
  const reply=(value,status=200) => {res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};
  try {
    if(url.pathname==='/health') return reply({ok:true});
    if(url.pathname==='/test/reset') { await db.close();db=await createTestDatabase();mails=[];links=new Map();sent=new Map();mode={};return reply({ok:true}); }
    if(url.pathname==='/test/mode') {mode={...mode,...body};return reply({ok:true});}
    if(url.pathname==='/test/state') return reply({mails,sent:[...sent.entries()],
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
    if(url.pathname==='/rest/v1/events') return reply((await db.query("SELECT id,title,event_date::text,venue,status FROM events WHERE status='upcoming' ORDER BY event_date,id")).rows.map(event=>({...event,start_time:'10:00:00',end_time:'17:00:00',description:'Test event',cover_image_url:null,ticket_price:10,capacity:100,tickets_sold:0,booking_link:null})));
    if(url.pathname.startsWith('/rest/v1/rpc/')) {
      const name=url.pathname.split('/').pop();
      if(!Object.hasOwn(functions,name)) return reply([]);
      if(mode.saveFailure && name==='submit_returning_vendor') {mode.saveFailure=false;return reply({code:'08006',message:'Simulated connection failure'},503);}
      const owner=req.headers.authorization===`Bearer ${jwt}` ? ids.owner : null;
      const args=functions[name];
      const result=await asUser(db,owner,tx => tx.query(`SELECT public.${name}(${args.map((_,i)=>`$${i+1}`).join(',')}) AS result`,args.map(key=>body[key])),owner?'authenticated':'anon');
      if(mode.lostResponse && name==='submit_returning_vendor') {mode.lostResponse=false;return reply({code:'08006',message:'Simulated lost response after commit'},503);}
      return reply(result.rows[0].result);
    }
    if(url.pathname.startsWith('/rest/v1/')) return reply([]);
    return reply({error:'Unknown fixture endpoint'},404);
  } catch(error) { return reply({code:error.code || 'fixture_error',message:error.message},400); }
});
server.listen(4319,'127.0.0.1',()=>console.log('Isolated database/email fixture on 4319'));
