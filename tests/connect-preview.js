// Isolated, disposable UI test server. Never connects to the application's remote database.
import 'dotenv/config';
import pg from 'pg';
import { randomBytes, scryptSync } from 'node:crypto';
import { createServer } from 'vite';

const base = new URL(process.env.TEST_DATABASE_URL || 'postgresql://localhost/postgres');
if (!['localhost', '127.0.0.1'].includes(base.hostname)) throw new Error('Preview requires local PostgreSQL');
const database = `hme_connect_preview_${process.pid}`;
const admin = new pg.Client({ connectionString: base.toString() });
await admin.connect();
await admin.query(`CREATE DATABASE "${database}"`);
base.pathname = `/${database}`;
process.env.DATABASE_URL = base.toString();
process.env.DATABASE_SSL_REJECT_UNAUTHORIZED = 'true';
process.env.COOKIE_SECURE = 'false';
process.env.APP_ORIGINS = 'http://localhost:5175';
process.env.SESSION_SECRET = randomBytes(32).toString('hex');
const { pool } = await import('../server/db.js');
const { migrate } = await import('../server/migrate.js');
await migrate();
const password = randomBytes(16).toString('hex');
const salt = randomBytes(16).toString('hex');
const hash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
for (const [name, nim, email, status] of [
  ['Connect QA', 'QA001', 'qaftmm-2022@student.unair.ac.id', 'mahasiswa'],
  ['Alumni QA', 'QA002', 'alumniftmm-2020@student.unair.ac.id', 'alumni'],
]) {
  const member = (await pool.query('INSERT INTO hme.members(name,nim,email,password_hash,status,angkatan) VALUES($1,$2,$3,$4,$5,$6) RETURNING id', [name,nim,email,hash,status,status === 'alumni' ? '2020' : '2022'])).rows[0];
  await pool.query('INSERT INTO hme.connect_profiles(member_id,username) VALUES($1,$2)', [member.id, `member_${member.id}`]);
}
const { app } = await import('../server/app.js');
const server = await new Promise(resolve => { const listener = app.listen(3002, '127.0.0.1', () => resolve(listener)); });
const vite = await createServer({ server: { port: 5175, strictPort: true, proxy: { '/api': 'http://127.0.0.1:3002' } } });
await vite.listen();
console.log(JSON.stringify({ url: 'http://localhost:5175/ime-connect', email: 'qaftmm-2022@student.unair.ac.id', password }));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => {
  await vite.close(); server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  await pool.end();
  await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`);
  await admin.end(); process.exit(0);
});
