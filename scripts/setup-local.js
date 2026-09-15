import { access, writeFile, chmod } from 'node:fs/promises';
import { randomBytes, scryptSync } from 'node:crypto';
import pg from 'pg';

try { await access('.env'); throw new Error('.env sudah ada. Konfigurasi lama tidak ditimpa. Jalankan npm run db:migrate.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const admin = new pg.Client({ host:'/tmp',database:'postgres',user:process.env.USER });
await admin.connect();
const exists=await admin.query("SELECT 1 FROM pg_database WHERE datname='hme_website'");
if (!exists.rowCount) await admin.query('CREATE DATABASE hme_website');
await admin.end();
const password=randomBytes(18).toString('base64url');
const config={ DATABASE_URL:`postgresql://${encodeURIComponent(process.env.USER)}@localhost:5432/hme_website`,SESSION_SECRET:randomBytes(48).toString('hex'),ADMIN_INVITE_CODE:randomBytes(24).toString('hex'),APP_ORIGINS:'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174',PORT:'3001',HOST:'127.0.0.1',LOCAL_ADMIN_EMAIL:'admin@hme.local',LOCAL_ADMIN_PASSWORD:password };
await writeFile('.env',Object.entries(config).map(([key,value]) => `${key}=${value}`).join('\n')+'\n',{ flag:'wx',mode:0o600 });
await chmod('.env',0o600);
Object.assign(process.env,config);
const { migrate }=await import('../server/migrate.js');
const { pool }=await import('../server/db.js');
try {
  await migrate();
  const salt=randomBytes(16).toString('hex');
  await pool.query('INSERT INTO hme.admins(name,email,password_hash) VALUES($1,$2,$3) ON CONFLICT(email) DO NOTHING',['Admin HME UA',config.LOCAL_ADMIN_EMAIL,`${salt}:${scryptSync(password,salt,64).toString('hex')}`]);
  console.log('PostgreSQL hme_website, schema hme, dan admin lokal siap. Kredensial tersimpan di .env (LOCAL_ADMIN_EMAIL / LOCAL_ADMIN_PASSWORD).');
} finally { await pool.end(); }
