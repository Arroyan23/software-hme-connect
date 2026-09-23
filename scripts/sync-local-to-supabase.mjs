// scripts/sync-local-to-supabase.mjs
// Sinkronisasi SATU ARAH: database lokal -> database online (Supabase).
// Aditif saja: tidak pernah DELETE / UPDATE / menimpa baris yang sudah ada.
// - Kolom yang belum ada di online ditambah (ADD COLUMN IF NOT EXISTS).
// - Baris yang belum ada di online disisipkan (ON CONFLICT DO NOTHING).
// - Identity sequence diperbaiki (setval ke max id) agar insert berikutnya aman.
//
// Pemakaian (dari host):
//   $env:SYNC_SOURCE_URL="postgresql://hme:<pass>@localhost:5432/hme_website"
//   npm run db:sync-remote
// atau di dalam container app (DATABASE_URL = online, DB lokal di host `db`):
//   docker compose exec -e SYNC_SOURCE_URL="postgresql://hme:<pass>@db:5432/hme_website" -T app node scripts/sync-local-to-supabase.mjs
import pg from 'pg';

const sourceUrl = process.env.SYNC_SOURCE_URL;
const targetUrl = process.env.DATABASE_URL;
if (!sourceUrl) { console.error('BATAL: SYNC_SOURCE_URL belum diatur (database lokal).'); process.exit(1); }
if (!targetUrl) { console.error('BATAL: DATABASE_URL belum diatur (database online).'); process.exit(1); }
if (new URL(sourceUrl).host === new URL(targetUrl).host) {
  console.error('BATAL: source dan target menunjuk database yang sama.');
  process.exit(1);
}

// sessions sengaja dilewati: data sesi login tiap server, tidak perlu disinkron.
const SKIP = new Set(['sessions']);
// Urutan menghormati foreign key (admins/content sebelum submissions/media).
const ORDER = ['migrations', 'admins', 'members', 'settings', 'content', 'submissions', 'media'];

const source = new pg.Pool({ connectionString: sourceUrl });
const target = new pg.Pool({ connectionString: targetUrl });

async function tableColumns(pool) {
  const { rows } = await pool.query(`
    SELECT c.table_name, c.column_name,
           format_type(a.atttypid, a.atttypmod) AS formatted,
           c.is_nullable, pg_get_expr(d.adbin, d.adrelid) AS addefault,
           c.is_identity
    FROM information_schema.columns c
    JOIN pg_class t ON t.relname = c.table_name AND t.relnamespace = 'hme'::regnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attname = c.column_name
    LEFT JOIN pg_attrdef d ON d.adrelid = t.oid AND d.adnum = a.attnum
    WHERE c.table_schema = 'hme'
    ORDER BY c.table_name, c.ordinal_position`);
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.table_name)) map.set(row.table_name, []);
    map.get(row.table_name).push(row);
  }
  return map;
}

async function primaryKeys(pool) {
  const { rows } = await pool.query(`
    SELECT kcu.table_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'hme' AND tc.constraint_type = 'PRIMARY KEY'
    ORDER BY kcu.table_name, kcu.ordinal_position`);
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.table_name)) map.set(row.table_name, []);
    map.get(row.table_name).push(row.column_name);
  }
  return map;
}

async function fillMissingColumns(table, srcCols, dstCols) {
  const dstNames = new Set(dstCols.map(c => c.column_name));
  const added = [];
  const dstCount = Number((await target.query(`SELECT count(*)::int AS n FROM hme."${table}"`)).rows[0].n);
  for (const col of srcCols) {
    if (dstNames.has(col.column_name)) continue;
    // Kolom NOT NULL tanpa default tidak bisa ditambah ke tabel berisi -> tambah nullable + peringatan.
    const needsNullableFallback = col.is_nullable === 'NO' && !col.addefault && dstCount > 0;
    const clause = needsNullableFallback ? '' : (col.is_nullable === 'NO' ? ' NOT NULL' : '');
    const defaultClause = col.addefault && !needsNullableFallback ? ` DEFAULT ${col.addefault}` : '';
    await target.query(`ALTER TABLE hme."${table}" ADD COLUMN IF NOT EXISTS "${col.column_name}" ${col.formatted}${defaultClause}${clause}`);
    added.push(col.column_name + (needsNullableFallback ? ' (nullable, aslinya NOT NULL)' : ''));
  }
  return added;
}

async function copyRows(table, pkCols, hasIdentity) {
  const colNames = (await source.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema='hme' AND table_name=$1 ORDER BY ordinal_position`,
    [table])).rows.map(r => r.column_name);
  const selectList = colNames.map(n => `"${n}"`).join(', ');
  const { rows } = await source.query(`SELECT ${selectList} FROM hme."${table}"`);
  const before = Number((await target.query(`SELECT count(*)::int AS n FROM hme."${table}"`)).rows[0].n);
  let inserted = 0;
  const skipped = [];
  if (!rows.length) return { total: 0, before, inserted, skipped, after: before };
  const conflict = pkCols.length ? `ON CONFLICT (${pkCols.map(c => `"${c}"`).join(', ')}) DO NOTHING` : '';
  const overriding = hasIdentity ? 'OVERRIDING SYSTEM VALUE ' : '';

  async function insertBatch(batch) {
    const values = [];
    const params = [];
    batch.forEach((row, i) => {
      const placeholders = colNames.map((_, j) => `$${i * colNames.length + j + 1}`);
      values.push(`(${placeholders.join(', ')})`);
      for (const name of colNames) params.push(row[name]);
    });
    const res = await target.query(
      `INSERT INTO hme."${table}" (${selectList}) ${overriding}VALUES ${values.join(', ')} ${conflict}`,
      params);
    return res.rowCount ?? 0;
  }

  const BATCH = 100;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    try {
      inserted += await insertBatch(batch);
    } catch {
      // Bentrok constraint non-PK (mis. email/nim unik): coba per baris, lewati yang gagal.
      for (const row of batch) {
        try { inserted += await insertBatch([row]); }
        catch (error) { skipped.push({ id: row[pkCols[0]] ?? '?', error: error.message.split('\n')[0] }); }
      }
    }
  }
  const after = Number((await target.query(`SELECT count(*)::int AS n FROM hme."${table}"`)).rows[0].n);
  return { total: rows.length, before, inserted, skipped, after };
}

async function repairSequences(identityCols) {
  const repaired = [];
  for (const { table_name, column_name } of identityCols) {
    const { rows } = await target.query(`SELECT max("${column_name}")::int AS m FROM hme."${table_name}"`);
    if (rows[0].m == null) continue;
    await target.query(`SELECT setval(pg_get_serial_sequence('hme."${table_name}"', '${column_name}'), $1)`, [rows[0].m]);
    repaired.push(`${table_name}.${column_name} -> ${rows[0].m}`);
  }
  return repaired;
}

try {
  const srcCols = await tableColumns(source);
  const dstCols = await tableColumns(target);
  const pkMap = await primaryKeys(target);
  const identityCols = [];
  for (const [, cols] of dstCols) for (const c of cols) if (c.is_identity === 'YES') identityCols.push(c);

  // 1. Pastikan tabel yang ada di lokal juga ada di online (CREATE IF NOT EXISTS generik tidak
  //    bisa direkonstruksi aman dari information_schema, jadi hanya laporkan bila ada yang hilang).
  for (const table of ORDER) {
    if (SKIP.has(table)) continue;
    if (!srcCols.has(table)) { console.log(`[${table}] tidak ada di lokal, dilewati.`); continue; }
    if (!dstCols.has(table)) {
      console.log(`[${table}] TIDAK ADA di online. Buat manual dulu dari server/schema.sql lalu jalankan ulang skrip ini.`);
      continue;
    }
  }

  // 2. Tambah kolom yang kurang di online.
  for (const table of ORDER) {
    if (SKIP.has(table) || !srcCols.has(table) || !dstCols.has(table)) continue;
    const added = await fillMissingColumns(table, srcCols.get(table), dstCols.get(table));
    console.log(`[${table}] kolom baru ditambahkan: ${added.length ? added.join(', ') : '(tidak ada)'}`);
  }

  // 3. Salin baris yang belum ada.
  for (const table of ORDER) {
    if (SKIP.has(table) || !srcCols.has(table) || !dstCols.has(table)) continue;
    const pkCols = pkMap.get(table) ?? [];
    if (!pkCols.length) { console.log(`[${table}] tanpa primary key di online, dilewati demi keamanan.`); continue; }
    const hasIdentity = dstCols.get(table).some(c => c.is_identity === 'YES');
    const r = await copyRows(table, pkCols, hasIdentity);
    console.log(`[${table}] lokal=${r.total} online_sebelum=${r.before} +ditambah=${r.inserted} online_sesudah=${r.after}${r.skipped.length ? ` dilewati=${r.skipped.length}` : ''}`);
    for (const s of r.skipped) console.log(`    - dilewati id=${s.id}: ${s.error}`);
  }

  // 4. Perbaiki sequence identity.
  const repaired = await repairSequences(identityCols);
  console.log(`sequence diperbaiki: ${repaired.length ? repaired.join(', ') : '(tidak ada)'}`);
  console.log('SELESAI. Tidak ada data yang dihapus atau ditimpa.');
} finally {
  await source.end();
  await target.end();
}
