import 'dotenv/config';
import { test,before,after } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import sharp from 'sharp';

const database=`hme_test_${process.pid}_${Date.now()}`;
const originalUrl=new URL(process.env.DATABASE_URL);
const adminUrl=new URL(originalUrl); adminUrl.pathname='/postgres';
const databaseAdmin=new pg.Client({connectionString:adminUrl.toString()});
let server,pool,base,admin;
const password='Test-password-123456';
const email='integration@example.test';

function client() {
  let cookie='',csrf='';
  return async (path,method='GET',body,extra={}) => {
    const headers={cookie,...extra};
    if(csrf) headers['x-csrf-token']=csrf;
    if(body && !(body instanceof FormData)) headers['content-type']='application/json';
    const response=await fetch(base+path,{method,headers,body:body ? body instanceof FormData ? body : JSON.stringify(body) : undefined});
    const setCookie=response.headers.get('set-cookie');
    if(setCookie) cookie=setCookie.split(';')[0];
    const data=await response.json().catch(() => null);
    if(data?.token) csrf=data.token;
    if(data?.csrf) csrf=data.csrf;
    return {status:response.status,data,headers:response.headers};
  };
}
before(async () => {
  await databaseAdmin.connect();
  await databaseAdmin.query(`CREATE DATABASE "${database}"`);
  originalUrl.pathname=`/${database}`; process.env.DATABASE_URL=originalUrl.toString();
  const db=await import('./db.js'); pool=db.pool;
  const {migrate}=await import('./migrate.js'); await migrate(); await migrate();
  const {app}=await import('./app.js');
  server=await new Promise(resolve => { const listener=app.listen(0,'127.0.0.1',() => resolve(listener)); });
  base=`http://127.0.0.1:${server.address().port}/api`;
  admin=client(); await admin('/auth/csrf');
  assert.equal((await admin('/auth/register','POST',{name:'Integration Admin',email,password,inviteCode:process.env.ADMIN_INVITE_CODE})).status,201);
});
after(async () => {
  if(server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  if(pool) await pool.end();
  await databaseAdmin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
  await databaseAdmin.end();
});

test('seed idempotent, public data and statistics come from PostgreSQL',async () => {
  const site=(await admin('/site')).data;
  assert.equal(site.tensiItems.length,6); assert.equal(site.kegiatanItems.length,6); assert.equal(site.alumniItems.length,6);
  assert.equal(site.dashboardStats.totalAnggota,0);
  assert.equal(site.pengurusItems.divisi.length,8);
  assert.ok(site.tensiItems[0].dateISO.match(/^\d{4}-\d{2}-\d{2}$/));
});
test('auth, invitation, CSRF, origin, session persistence and logout',async () => {
  const guest=client();
  assert.equal((await guest('/auth/me')).status,401);
  assert.equal((await guest('/auth/login','POST',{email,password})).status,403);
  await guest('/auth/csrf');
  assert.equal((await guest('/auth/register','POST',{name:'Bad',email:'bad@example.test',password,inviteCode:'wrong'})).status,403);
  assert.equal((await guest('/tensi','POST',{})).status,401);
  assert.equal((await guest('/submissions')).status,401);
  assert.equal((await guest('/auth/login','POST',{email,password:'wrong'})).status,401);
  assert.equal((await guest('/auth/login','POST',{email,password},{origin:'https://untrusted.example'})).status,403);
  const login=await guest('/auth/login','POST',{email,password});
  assert.equal(login.status,200); assert.match(login.headers.get('set-cookie'),/HttpOnly/);
  assert.equal((await guest('/auth/me')).data.email,email);
  const stored=await pool.query("SELECT count(*)::int AS n FROM hme.sessions WHERE sess->>'adminId' IS NOT NULL"); assert.ok(stored.rows[0].n >= 2);
  const hashes=await pool.query('SELECT password_hash FROM hme.admins WHERE email=$1',[email]); assert.notEqual(hashes.rows[0].password_hash,password);
  assert.equal((await guest('/auth/logout','POST')).status,200);
  assert.equal((await guest('/auth/me')).status,401);
});
test('CRUD for every content kind persists, validates, searches and deletes',async () => {
  const examples={
    tensi:{title:'Test TENSI',category:'Magang',excerpt:'Informasi uji',date:'2026-09-16'},
    kegiatan:{title:'Test Kegiatan',date:'2026-09-16',location:'Kampus',desc:'Deskripsi'},
    alumni:{name:'Test Alumni',angkatan:'2020',company:'PT Test',position:'Engineer',title:'Test Alumni',desc:'Deskripsi',type:'Sharing'},
    dosen:{name:'Test Dosen',photo:''},petinggi:{name:'Test Ketua',jabatan:'Ketua Uji',angkatan:'2023'},divisi:{nama:'Test Divisi',kepanjangan:'Divisi Uji',kepala:'Test Kepala',anggota:5},
  };
  for(const [kind,body] of Object.entries(examples)) {
    const created=await admin(`/${kind}`,'POST',body); assert.equal(created.status,201,JSON.stringify(created.data));
    const id=created.data.id;
    assert.equal((await admin(`/${kind}/${id}`)).status,200);
    const stored=await pool.query('SELECT data FROM hme.content WHERE id=$1',[id]); assert.ok(stored.rowCount);
    const key=body.title ? 'title' : body.name ? 'name' : 'nama';
    assert.equal((await admin(`/${kind}/${id}`,'PUT',{...body,[key]:'Updated Test'})).data[key],'Updated Test');
    const found=(await admin(`/${kind}?q=Updated%20Test`)).data; assert.equal(found.length,1);
    assert.equal((await admin(`/${kind}/${id}`,'DELETE')).status,200);
    assert.equal((await admin(`/${kind}/${id}`)).status,404);
  }
  assert.equal((await admin('/tensi','POST',{...examples.tensi,date:'2026-02-30'})).status,400);
  assert.equal((await admin('/tensi','POST',{...examples.tensi,link:'javascript:alert(1)'})).status,400);
  assert.equal((await admin('/divisi','POST',{...examples.divisi,anggota:-1})).status,400);
  assert.equal((await admin('/tensi/not-an-id')).status,400);
  assert.equal((await admin('/tensi?q=%27%20OR%201%3D1--')).status,200);
});
test('alumni moderation is atomic and never exposes sender email publicly',async () => {
  const guest=client(); await guest('/auth/csrf');
  const body={name:'Alumni Uji',angkatan:'2020',company:'PT Test',position:'Engineer',title:'Pending Alumni',desc:'Info uji',type:'Sharing',email:'private@example.test'};
  const submitted=await guest('/submissions/alumni','POST',body); assert.equal(submitted.status,201);
  assert.equal((await guest('/alumni?q=Pending')).data.length,0);
  const id=submitted.data.id;
  const [a,b]=await Promise.all([admin(`/submissions/${id}/status`,'PATCH',{status:'approved'}),admin(`/submissions/${id}/status`,'PATCH',{status:'approved'})]);
  assert.deepEqual([a.status,b.status].sort(),[200,409]);
  const published=(await guest('/alumni?q=Pending')).data; assert.equal(published.length,1); assert.equal(published[0].email,undefined);
  const reject=await guest('/submissions/alumni','POST',{...body,title:'Rejected Alumni'});
  assert.equal((await admin(`/submissions/${reject.data.id}/status`,'PATCH',{status:'rejected'})).status,200);
  assert.equal((await guest('/alumni?q=Rejected')).data.length,0);
});
test('members require approval; duplicate NIM rejected and stats update',async () => {
  const guest=client(); await guest('/auth/csrf');
  const body={name:'Mahasiswa Uji',nim:'1234567890',angkatan:'2026',email:'member@example.test',phone:'081234567890',motivation:'Ingin bergabung'};
  const created=await guest('/submissions/anggota','POST',body); assert.equal(created.status,201);
  assert.equal((await guest('/submissions/anggota','POST',body)).status,409);
  assert.equal((await admin('/dashboard/stats')).data.totalAnggota,0);
  assert.equal((await admin(`/submissions/${created.data.id}/status`,'PATCH',{status:'approved'})).status,200);
  assert.equal((await admin('/dashboard/stats')).data.totalAnggota,1);
});
test('settings persist and invalid social URLs rejected',async () => {
  const settings=(await admin('/settings')).data;
  settings.periode='2026/2027'; settings.instagram='https://instagram.com/example';
  assert.equal((await admin('/settings','PUT',settings)).status,200);
  assert.equal((await admin('/site')).data.settings.periode,'2026/2027');
  assert.equal((await admin('/settings','PUT',{...settings,instagram:'javascript:alert(1)'})).status,400);
});
test('image upload validates bytes and stores retrievable WebP in PostgreSQL',async () => {
  const invalid=new FormData(); invalid.append('file',new Blob(['not a png'],{type:'image/png'}),'bad.png');
  assert.equal((await admin('/media','POST',invalid)).status,400);
  const bytes=await sharp({create:{width:10,height:10,channels:3,background:'#c9970d'}}).png().toBuffer();
  const form=new FormData(); form.append('file',new Blob([bytes],{type:'image/png'}),'test.png');
  const uploaded=await admin('/media','POST',form); assert.equal(uploaded.status,201);
  const image=await fetch(base.replace('/api','')+uploaded.data.url);
  assert.equal(image.headers.get('content-type'),'image/webp'); assert.ok((await image.arrayBuffer()).byteLength > 0);
  const row=await pool.query('SELECT mime FROM hme.media WHERE id=$1',[uploaded.data.url.split('/').pop()]); assert.equal(row.rows[0].mime,'image/webp');
});
