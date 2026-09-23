import express from 'express';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import multer from 'multer';
import sharp from 'sharp';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { z } from 'zod';
import { pool, transaction } from './db.js';
import { schemas, present, memberSchema, alumniSubmissionSchema, settingsSchema, registerSchema, memberRegisterSchema, loginSchema, entryYearFromEmail } from './validation.js';

const scrypt = promisify(scryptCallback);
const fail = (status, message) => Object.assign(new Error(message), { status });
const equal = (a, b) => { const x = Buffer.from(a); const y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x,y); };
const saveSession = req => new Promise((ok, no) => req.session.save(e => e ? no(e) : ok()));
const regenerate = req => new Promise((ok, no) => req.session.regenerate(e => e ? no(e) : ok()));
export const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, strictTransportSecurity: process.env.NODE_ENV === 'production' ? undefined : false }));
app.use(express.json({ limit: '100kb' }));
const PgStore = connectPg(session);
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) throw new Error('SESSION_SECRET minimal 32 karakter');
app.use('/api', session({
  name: 'hme.sid', secret: process.env.SESSION_SECRET,
  store: new PgStore({ pool, schemaName: 'hme', tableName: 'sessions' }),
  proxy: true,
  resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.COOKIE_SECURE === 'true', maxAge: 8 * 60 * 60 * 1000 },
}));
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (['GET','HEAD','OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin && !process.env.APP_ORIGINS?.split(',').includes(origin)) return next(fail(403, 'Origin tidak diizinkan'));
  if (!req.session.csrf || !equal(req.get('x-csrf-token') || '', req.session.csrf)) return next(fail(403, 'Sesi formulir kedaluwarsa. Muat ulang halaman.'));
  next();
});
app.get('/api/health', async (req, res) => { await pool.query('SELECT 1'); res.json({ status: 'ok', database: 'postgresql' }); });
app.get('/api/auth/csrf', async (req, res, next) => {
  try {
    req.session.csrf ||= randomBytes(32).toString('hex');
    await saveSession(req);
    res.json({ token: req.session.csrf });
  } catch (error) {
    next(error);
  }
});
const authLimit = rateLimit({ windowMs: 15*60*1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Terlalu banyak percobaan. Coba lagi 15 menit lagi.' } });
async function signedIn(req, res, next) {
  if (!req.session.adminId || req.session.role !== 'admin') return next(fail(401, 'Silakan login sebagai admin'));
  const { rows } = await pool.query('SELECT id,name,email FROM hme.admins WHERE id=$1', [req.session.adminId]);
  if (!rows[0]) return next(fail(401, 'Sesi tidak valid'));
  req.admin = rows[0]; next();
}
async function authenticate(req, account, role) {
  await regenerate(req);
  req.session.role = role;
  req.session[role === 'admin' ? 'adminId' : 'memberId'] = account.id;
  req.session.csrf = randomBytes(32).toString('hex');
  await saveSession(req);
  return { user: { id:account.id,name:account.name,email:account.email,nim:account.nim,status:account.status,role }, csrf: req.session.csrf };
}
app.post('/api/auth/register', authLimit, async (req,res) => {
  const data = registerSchema.parse(req.body);
  if (!process.env.ADMIN_INVITE_CODE || !equal(data.inviteCode, process.env.ADMIN_INVITE_CODE)) throw fail(403, 'Kode undangan admin tidak valid');
  const salt = randomBytes(16).toString('hex');
  const hash = (await scrypt(data.password,salt,64)).toString('hex');
  const { rows } = await pool.query('INSERT INTO hme.admins(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,name,email', [data.name,data.email,`${salt}:${hash}`]);
  res.status(201).json(await authenticate(req,rows[0],'admin'));
});
app.post('/api/auth/register-member', authLimit, async (req,res) => {
  const data = memberRegisterSchema.parse(req.body);
  const salt = randomBytes(16).toString('hex');
  const hash = (await scrypt(data.password,salt,64)).toString('hex');
  const angkatan = entryYearFromEmail(data.email);
  const { rows } = await pool.query('INSERT INTO hme.members(name,nim,email,password_hash,status,angkatan) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,name,nim,email,status,angkatan', [data.name,data.nim,data.email,`${salt}:${hash}`,data.status,angkatan]);
  res.status(201).json(await authenticate(req,rows[0],'member'));
});
app.post('/api/auth/login', authLimit, async (req,res) => {
  const data = loginSchema.parse(req.body);
  const adminResult = await pool.query('SELECT *,\'admin\' AS role FROM hme.admins WHERE email=$1', [data.email]);
  const memberResult = adminResult.rowCount ? { rows:[] } : await pool.query('SELECT *,\'member\' AS role FROM hme.members WHERE email=$1', [data.email]);
  const account = adminResult.rows[0] || memberResult.rows[0];
  const [salt,hash] = (account?.password_hash || `${'0'.repeat(32)}:${'0'.repeat(128)}`).split(':');
  const candidate = (await scrypt(data.password,salt,64)).toString('hex');
  if (!account || !equal(candidate,hash)) throw fail(401,'Email atau password salah');
  res.json(await authenticate(req,account,account.role));
});
app.get('/api/auth/me', signedIn, (req,res) => res.json(req.admin));
app.post('/api/auth/logout', async (req,res) => {
  await new Promise((ok,no) => req.session.destroy(e => e ? no(e) : ok()));
  res.clearCookie('hme.sid', { httpOnly:true,sameSite:'lax',secure:process.env.COOKIE_SECURE === 'true' }).json({ ok:true });
});
app.get('/api/users', signedIn, async (req,res) => {
  const { rows } = await pool.query("SELECT id,name,email,NULL::text AS nim,'admin' AS role,NULL::text AS status,NULL::text AS angkatan,created_at FROM hme.admins UNION ALL SELECT id,name,email,nim,'member' AS role,status,angkatan,created_at FROM hme.members ORDER BY created_at DESC,id DESC");
  res.json(rows);
});
async function stats(client = pool) {
  const { rows } = await client.query("SELECT kind,count(*)::int AS total FROM hme.content GROUP BY kind");
  const counts = Object.fromEntries(rows.map(r => [r.kind,r.total]));
  const members = await client.query("SELECT count(*) FILTER(WHERE kind='anggota' AND status='approved')::int AS members, count(*) FILTER(WHERE status='pending')::int AS pending FROM hme.submissions");
  return { totalTensi:counts.tensi||0,totalKegiatan:counts.kegiatan||0,totalAlumni:counts.alumni||0,totalAnggota:members.rows[0].members,totalDivisi:counts.divisi||0,pending:members.rows[0].pending };
}
app.get('/api/site', async (req,res) => {
  const { rows } = await pool.query("SELECT * FROM hme.content ORDER BY COALESCE(data->>'date','') DESC,id ASC");
  const byKind = kind => rows.filter(r => r.kind === kind).map(present);
  res.json({ tensiItems:byKind('tensi'),kegiatanItems:byKind('kegiatan'),alumniItems:byKind('alumni'),dosenItems:byKind('dosen'),pengurusItems:{ petinggi:byKind('petinggi'),divisi:byKind('divisi') },settings:(await pool.query('SELECT data FROM hme.settings')).rows[0].data, dashboardStats:await stats() });
});
app.get('/api/dashboard/stats', signedIn, async (req,res) => res.json(await stats()));
app.get('/api/settings', async (req,res) => res.json((await pool.query('SELECT data FROM hme.settings')).rows[0].data));
app.put('/api/settings', signedIn, async (req,res) => { const data=settingsSchema.parse(req.body); await pool.query('UPDATE hme.settings SET data=$1',[data]); res.json(data); });
const upload = multer({ storage:multer.memoryStorage(),limits:{ fileSize:5*1024*1024,files:1 } });
app.post('/api/media', signedIn, upload.single('file'), async (req,res) => {
  if (!req.file) throw fail(400,'Pilih gambar');
  let bytes;
  try { bytes = await sharp(req.file.buffer,{ limitInputPixels:25000000 }).rotate().resize({ width:1600,height:1600,fit:'inside',withoutEnlargement:true }).webp({ quality:85 }).toBuffer(); }
  catch { throw fail(400,'Gambar tidak valid. Gunakan JPEG, PNG, atau WebP.'); }
  const id=randomUUID();
  await pool.query('INSERT INTO hme.media(id,bytes,mime,created_by) VALUES($1,$2,$3,$4)',[id,bytes,'image/webp',req.admin.id]);
  res.status(201).json({ url:`/api/media/${id}` });
});
app.get('/api/media/:id', async (req,res) => {
  const id=z.uuid().parse(req.params.id);
  const { rows }=await pool.query('SELECT bytes,mime FROM hme.media WHERE id=$1',[id]);
  if (!rows[0]) throw fail(404,'Gambar tidak ditemukan');
  res.set('Cache-Control','public, max-age=31536000, immutable').type(rows[0].mime).send(rows[0].bytes);
});
const publicLimit=rateLimit({ windowMs:60*60*1000,limit:15,message:{ message:'Batas pengiriman tercapai. Coba satu jam lagi.' } });
for (const kind of ['alumni','anggota']) {
  app.post(`/api/submissions/${kind}`,publicLimit,async (req,res) => {
    const data=(kind === 'alumni' ? alumniSubmissionSchema : memberSchema).parse(req.body);
    const { rows }=await pool.query('INSERT INTO hme.submissions(kind,data) VALUES($1,$2) RETURNING id,status',[kind,data]);
    res.status(201).json(rows[0]);
  });
}
app.get('/api/submissions',signedIn,async (req,res) => res.json((await pool.query('SELECT id,kind,data,status,created_at FROM hme.submissions ORDER BY id DESC')).rows));
app.patch('/api/submissions/:id/status',signedIn,async (req,res) => {
  const id=z.coerce.number().int().positive().parse(req.params.id);
  const { status }=z.object({ status:z.enum(['approved','rejected']) }).parse(req.body);
  const result=await transaction(async client => {
    const row=(await client.query('SELECT * FROM hme.submissions WHERE id=$1 FOR UPDATE',[id])).rows[0];
    if (!row) throw fail(404,'Kiriman tidak ditemukan');
    if (row.status !== 'pending') throw fail(409,'Kiriman sudah ditinjau');
    let publishedId=null;
    if (status === 'approved' && row.kind === 'alumni') {
      const data=schemas.alumni.parse(row.data);
      publishedId=(await client.query("INSERT INTO hme.content(kind,data) VALUES('alumni',$1) RETURNING id",[data])).rows[0].id;
    }
    return (await client.query('UPDATE hme.submissions SET status=$1,reviewed_by=$2,published_id=$3 WHERE id=$4 RETURNING id,status',[status,req.admin.id,publishedId,id])).rows[0];
  }); res.json(result);
});
for (const [kind,schema] of Object.entries(schemas)) {
  app.get(`/api/${kind}`,async (req,res) => {
    const query=z.object({ q:z.string().max(200).default(''),category:z.string().max(50).default('') }).parse(req.query);
    const { rows }=await pool.query("SELECT * FROM hme.content WHERE kind=$1 AND data::text ILIKE $2 AND ($3='' OR data->>'category'=$3) ORDER BY COALESCE(data->>'date','') DESC,id ASC",[kind,`%${query.q}%`,query.category]);
    res.json(rows.map(present));
  });
  app.get(`/api/${kind}/:id`,async (req,res) => {
    const id=z.coerce.number().int().positive().parse(req.params.id);
    const row=(await pool.query('SELECT * FROM hme.content WHERE kind=$1 AND id=$2',[kind,id])).rows[0];
    if (!row) throw fail(404,'Data tidak ditemukan'); res.json(present(row));
  });
  app.post(`/api/${kind}`,signedIn,async (req,res) => {
    const data=schema.parse(req.body);
    const row=(await pool.query('INSERT INTO hme.content(kind,data) VALUES($1,$2) RETURNING *',[kind,data])).rows[0];
    res.status(201).json(present(row));
  });
  app.put(`/api/${kind}/:id`,signedIn,async (req,res) => {
    const id=z.coerce.number().int().positive().parse(req.params.id); const data=schema.parse(req.body);
    const row=(await pool.query('UPDATE hme.content SET data=$1,updated_at=now() WHERE id=$2 AND kind=$3 RETURNING *',[data,id,kind])).rows[0];
    if (!row) throw fail(404,'Data tidak ditemukan'); res.json(present(row));
  });
  app.delete(`/api/${kind}/:id`,signedIn,async (req,res) => {
    const id=z.coerce.number().int().positive().parse(req.params.id);
    const result=await pool.query('DELETE FROM hme.content WHERE id=$1 AND kind=$2',[id,kind]);
    if (!result.rowCount) throw fail(404,'Data tidak ditemukan'); res.json({ ok:true });
  });
}
app.use('/api', (req,res) => res.status(404).json({ message:'Endpoint tidak ditemukan' }));
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(resolve('dist')));
  app.get('/{*path}',(req,res) => res.sendFile(resolve('dist/index.html')));
}
app.use((error,req,res,next) => {
  if (res.headersSent) return next(error);
  if (error instanceof z.ZodError) return res.status(400).json({ message:error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') });
  if (error.code === '23505') return res.status(409).json({ message:'Email atau NIM sudah terdaftar' });
  if (error instanceof multer.MulterError) return res.status(400).json({ message:'Unggahan maksimal 5 MB dan satu gambar.' });
  const status=error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ message:status >= 500 ? 'Terjadi kesalahan server' : error.message });
});
