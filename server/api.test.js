import 'dotenv/config';
import { test,before,after } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import sharp from 'sharp';

const database=`hme_test_${process.pid}_${Date.now()}`;
const originalUrl=new URL(process.env.TEST_DATABASE_URL || process.env.DATABASE_URL);
if (!['localhost', '127.0.0.1', '[::1]'].includes(originalUrl.hostname) && !process.env.TEST_DATABASE_URL) {
  throw new Error('Gunakan TEST_DATABASE_URL khusus pengujian atau DATABASE_URL PostgreSQL lokal. Tes tidak dijalankan pada database remote aplikasi.');
}
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
  for (const kind of ['petinggi','divisi']) {
    const existing=(await admin(`/${kind}`)).data[0];
    const photo=uploaded.data.url;
    assert.equal((await admin(`/${kind}/${existing.id}`,'PUT',{...existing,photo})).status,200);
    const stored=(await pool.query('SELECT data FROM hme.content WHERE id=$1',[existing.id])).rows[0].data;
    assert.equal(stored.photo,photo);
    const publicItem=(await admin('/site')).data.pengurusItems[kind].find(item => item.id === existing.id);
    assert.equal(publicItem.photo,photo);
    assert.equal((await admin(`/${kind}/${existing.id}`,'PUT',{...existing,photo:'javascript:alert(1)'})).status,400);
    assert.equal((await admin(`/${kind}/${existing.id}`,'PUT',{...existing,photo:''})).status,200);
    assert.equal((await admin('/site')).data.pengurusItems[kind].find(item => item.id === existing.id).photo,'');
  }
});

test('IME Connect authenticates members and admins; all social endpoints reject guests', async () => {
  const guest=client();
  for (const path of ['/connect/me','/connect/posts','/connect/posts/1','/connect/posts/1/comments','/connect/profiles','/connect/profiles/1','/connect/profiles/1/avatar','/connect/summary']) {
    assert.equal((await guest(path)).status,401,path);
  }
  await guest('/auth/csrf');
  for (const [path,method] of [['/connect/posts','POST'],['/connect/me','PUT'],['/connect/profiles/1/follow','PUT'],['/connect/posts/1/like','PUT'],['/connect/posts/1/save','PUT'],['/connect/posts/1/share','PUT'],['/connect/posts/1/comments','POST'],['/connect/comments/1','DELETE']]) {
    assert.equal((await guest(path,method,{})).status,401,path);
  }
  assert.equal((await admin('/connect/me')).data.role,'admin');
  const row=await pool.query("SELECT relname,relrowsecurity FROM pg_class JOIN pg_namespace n ON n.oid=relnamespace WHERE n.nspname='hme' AND relname LIKE 'connect_%' AND relkind='r'");
  assert.equal(row.rowCount,7); assert.ok(row.rows.every(table => table.relrowsecurity));
});

test('IME Connect full member lifecycle, ownership, concurrency, filters, pagination and deletion', async () => {
  const alice=client(),bob=client(),alumni=client();
  const register=async (request,name,nim,status='mahasiswa') => {
    await request('/auth/csrf');
    const result=await request('/auth/register-member','POST',{ name,nim,email:`${name.toLowerCase()}ftmm-2022@student.unair.ac.id`,password,status });
    assert.equal(result.status,201,JSON.stringify(result.data));
    return (await request('/connect/me')).data;
  };
  const a=await register(alice,'Alice','social1001');
  const b=await register(bob,'Bobby','social1002');
  await register(alumni,'Senior','social1003','alumni');
  assert.equal((await alice('/auth/me')).status,401,'member remains excluded from admin auth');
  assert.equal((await alice('/users')).status,401);
  assert.equal((await alice('/tensi','POST',{})).status,401);
  const body={title:'Riset Smartgrid',body:'Diskusi energi #SmartGrid #smartgrid',category:'Akademik'};
  assert.equal((await alice('/connect/posts','POST',{...body,category:'TENSI'})).status,403);
  assert.equal((await alice('/connect/posts','POST',{...body,category:'Alumni'})).status,403);
  assert.equal((await alumni('/connect/posts','POST',{...body,category:'Alumni'})).status,201);
  assert.equal((await admin('/connect/posts','POST',{...body,category:'TENSI'})).status,201);
  for (const invalid of [{...body,title:' '},{...body,body:'x'.repeat(10001)},{...body,category:'invalid'}]) assert.equal((await alice('/connect/posts','POST',invalid)).status,400);
  const created=await alice('/connect/posts','POST',{...body,author_id:b.id});
  assert.equal(created.status,201,JSON.stringify(created.data));
  const id=created.data.id;
  assert.equal(created.data.author_id,a.id,'author cannot be forged');
  assert.equal((await bob(`/connect/posts/${id}`,'PUT',body)).status,404);
  assert.equal((await bob(`/connect/posts/${id}`,'DELETE')).status,404);
  assert.equal((await alice(`/connect/posts/${id}`,'PUT',{...body,title:'Riset Smartgrid Revisi'})).data.title,'Riset Smartgrid Revisi');
  const attempts=await Promise.all(Array.from({length:6},()=>bob(`/connect/posts/${id}/like`,'PUT')));
  assert.ok(attempts.every(result=>result.status===200));
  assert.equal((await alice(`/connect/posts/${id}`)).data.likes,1,'concurrent retries count once');
  assert.equal((await bob(`/connect/posts/${id}`)).data.liked,true);
  assert.equal((await alice(`/connect/posts/${id}`)).data.liked,false);
  for (const action of ['save','share']) {
    assert.equal((await bob(`/connect/posts/${id}/${action}`,'PUT')).status,200);
    assert.equal((await bob(`/connect/posts/${id}/${action}`,'PUT')).status,200);
  }
  assert.equal((await bob(`/connect/posts/${id}`)).data.shares,1);
  assert.equal((await bob('/connect/posts?saved=true')).data.items.length,1);
  assert.equal((await alice('/connect/posts?saved=true')).data.items.length,0,'saved list is private');
  const comment=await bob(`/connect/posts/${id}/comments`,'POST',{body:'Komentar asli',author_id:a.id});
  assert.equal(comment.status,201);
  assert.equal((await alice(`/connect/comments/${comment.data.id}`,'PUT',{body:'Diubah orang lain'})).status,404);
  assert.equal((await alice(`/connect/comments/${comment.data.id}`,'DELETE')).status,404);
  assert.equal((await bob(`/connect/comments/${comment.data.id}`,'PUT',{body:'Komentar revisi'})).status,200);
  const comments=(await alice(`/connect/posts/${id}/comments`)).data.items;
  assert.equal(comments[0].body,'Komentar revisi'); assert.equal(comments[0].author_id,b.id);
  assert.equal((await bob(`/connect/posts/${id}/comments`,'POST',{body:'x'.repeat(2001)})).status,400);
  assert.equal((await bob(`/connect/posts/${id}/comments`,'POST',{body:' '})).status,400);
  assert.equal((await bob(`/connect/profiles/${b.id}/follow`,'PUT')).status,400);
  await Promise.all([bob(`/connect/profiles/${a.id}/follow`,'PUT'),bob(`/connect/profiles/${a.id}/follow`,'PUT')]);
  assert.equal((await alice('/connect/me')).data.followers_count,1);
  assert.equal((await bob('/connect/me')).data.following_count,1);
  assert.equal((await bob('/connect/profiles?tab=following')).data.items[0].id,a.id);
  assert.equal((await alice('/connect/profiles?tab=followers')).data.items[0].id,b.id);
  assert.equal((await bob(`/connect/profiles?tab=followers&owner=${a.id}`)).data.items[0].id,b.id);
  const profile={name:'Alice Updated',username:'alice_updated',bio:'Bio baru',headline:'Riset energi',company:'Lab Elektro',badges:['Smart Grid']};
  assert.equal((await alice('/connect/me','PUT',{...profile,role:'admin',status:'alumni',member_id:999})).status,200);
  assert.equal((await alice('/connect/me')).data.role,'member');
  assert.equal((await alice('/connect/me')).data.status,'mahasiswa');
  assert.equal((await alice('/connect/posts','POST',{...body,category:'TENSI'})).status,403);
  assert.equal((await bob('/connect/me','PUT',profile)).status,409);
  assert.equal((await bob('/connect/me','PUT',{...profile,username:'admin_999'})).status,400);
  const visible=(await bob(`/connect/profiles/${a.id}`)).data;
  assert.equal(visible.name,profile.name); assert.equal(visible.email,undefined); assert.equal(visible.nim,undefined); assert.equal(visible.member_id,undefined); assert.equal(visible.password_hash,undefined);
  assert.equal((await bob('/connect/profiles?q=Alice%20Updated')).data.items[0].id,a.id);
  for (let i=0;i<3;i++) assert.equal((await alice('/connect/posts','POST',{...body,title:`Cursor ${i}`})).status,201);
  const first=(await alice(`/connect/posts?author=${a.id}&limit=2`)).data;
  const second=(await alice(`/connect/posts?author=${a.id}&limit=2&before=${first.nextCursor}`)).data;
  assert.equal(first.items.length,2); assert.equal(second.items.length,2); assert.equal(second.nextCursor,null);
  assert.equal(new Set([...first.items,...second.items].map(post=>post.id)).size,4);
  assert.equal((await alice('/connect/posts?q=Revisi')).data.items.length,1);
  assert.ok((await alice('/connect/posts?tag=smartgrid')).data.items.length>=4);
  const channel=(await alice('/connect/posts?category=TENSI')).data.items;
  assert.equal(channel.length,1); assert.equal(channel[0].category,'TENSI');
  const summary=(await alice('/connect/summary')).data;
  assert.equal(summary.stats.editions,1); assert.equal(summary.stats.readers,1); assert.equal(summary.stats.alumni,1);
  assert.ok(summary.trending.some(tag=>tag.tag==='smartgrid'));
  assert.equal((await alice('/connect/posts?limit=1000')).status,400);
  assert.equal((await alice('/connect/posts?before=abc')).status,400);
  assert.equal((await alice('/connect/posts/invalid')).status,400);
  assert.equal((await alice('/connect/posts?q=%27%20OR%201%3D1--')).status,200);
  assert.equal((await bob(`/connect/posts/${id}/like`,'DELETE')).data.likes,0);
  assert.equal((await bob(`/connect/posts/${id}/save`,'DELETE')).data.saved,false);
  assert.equal((await bob(`/connect/profiles/${a.id}/follow`,'DELETE')).data.followers_count,0);
  assert.equal((await admin(`/connect/comments/${comment.data.id}`,'DELETE')).status,200,'admin moderates comments');
  await bob(`/connect/posts/${id}/comments`,'POST',{body:'Cascade me'});
  await bob(`/connect/posts/${id}/like`,'PUT'); await bob(`/connect/posts/${id}/save`,'PUT');
  assert.equal((await alice(`/connect/posts/${id}`,'DELETE')).status,200);
  for (const table of ['connect_comments','connect_likes','connect_saves','connect_shares']) assert.equal((await pool.query(`SELECT count(*)::int AS n FROM hme.${table} WHERE post_id=$1`,[id])).rows[0].n,0);
  assert.equal((await bob(`/connect/posts/${id}`)).status,404);
  assert.equal((await bob(`/connect/posts/${id}/like`,'PUT')).status,404);
  assert.equal((await bob('/auth/logout','POST')).status,200);
  assert.equal((await bob('/connect/posts')).status,401);
  await bob('/auth/csrf');
  assert.equal((await bob('/auth/login','POST',{email:'bobbyftmm-2022@student.unair.ac.id',password})).status,200);
  assert.equal((await bob('/connect/me')).data.id,b.id,'same identity after login');
});

test('IME Connect avatar is private, compressed, replaced in place and removable', async () => {
  const profile=(await admin('/connect/me')).data;
  const invalid=new FormData(); invalid.append('file',new Blob(['not an image']), 'fake.png');
  assert.equal((await admin('/connect/me/avatar','PUT',invalid)).status,400);
  const svg=new FormData(); svg.append('file',new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>'],{type:'image/svg+xml'}),'avatar.svg');
  assert.equal((await admin('/connect/me/avatar','PUT',svg)).status,400);
  const bytes=await sharp({create:{width:800,height:600,channels:3,background:'#c99235'}}).png().toBuffer();
  for (let i=0;i<2;i++) {
    const form=new FormData(); form.append('file',new Blob([bytes],{type:'image/png'}),'avatar.png');
    assert.equal((await admin('/connect/me/avatar','PUT',form)).status,200);
  }
  const stored=(await pool.query('SELECT avatar,avatar_version FROM hme.connect_profiles WHERE id=$1',[profile.id])).rows[0];
  assert.equal(stored.avatar_version,2); assert.ok(stored.avatar.length<=65536);
  const metadata=await sharp(stored.avatar).metadata(); assert.equal(metadata.format,'webp'); assert.equal(metadata.width,256); assert.equal(metadata.height,256);
  const guest=client(); assert.equal((await guest(`/connect/profiles/${profile.id}/avatar`)).status,401);
  const fetched=await admin(`/connect/profiles/${profile.id}/avatar`); assert.equal(fetched.status,200); assert.equal(fetched.headers.get('cache-control'),'no-store');
  assert.equal((await admin('/connect/me/avatar','DELETE')).data.avatar,null);
  assert.equal((await admin(`/connect/profiles/${profile.id}/avatar`)).status,404);
});

test('IME Connect publishing quota is atomic in PostgreSQL and resets after one hour', async () => {
  const profile=(await admin('/connect/me')).data;
  await pool.query('UPDATE hme.connect_profiles SET publish_count=59,publish_window=now() WHERE id=$1',[profile.id]);
  const body={title:'Quota test',body:'Quota storage protection',category:'Info Kampus'};
  const result=await Promise.all([admin('/connect/posts','POST',body),admin('/connect/posts','POST',body)]);
  assert.deepEqual(result.map(r=>r.status).sort(),[201,429]);
  assert.equal((await pool.query('SELECT publish_count FROM hme.connect_profiles WHERE id=$1',[profile.id])).rows[0].publish_count,60);
  const post=result.find(r=>r.status===201).data;
  assert.equal((await admin(`/connect/posts/${post.id}/comments`,'POST',{body:'Blocked comment'})).status,429);
  await pool.query("UPDATE hme.connect_profiles SET publish_window=now()-interval '2 hours' WHERE id=$1",[profile.id]);
  assert.equal((await admin(`/connect/posts/${post.id}/comments`,'POST',{body:'Allowed after reset'})).status,201);
  assert.equal((await pool.query('SELECT publish_count FROM hme.connect_profiles WHERE id=$1',[profile.id])).rows[0].publish_count,1);
});
