import 'dotenv/config';
import pg from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL belum diatur. Jalankan npm run setup:local atau isi .env.');
const connectionUrl = new URL(process.env.DATABASE_URL);
const skipCertificateVerification = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false';
if (skipCertificateVerification) connectionUrl.searchParams.delete('sslmode');
export const pool = new pg.Pool({
  connectionString: connectionUrl.toString(),
  ...(skipCertificateVerification ? { ssl: { rejectUnauthorized: false } } : {}),
});
export async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
