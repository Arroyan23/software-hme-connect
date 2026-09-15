import { readFile } from 'node:fs/promises';
import { pool, transaction } from './db.js';
import { allKegiatan, allAlumni } from './extra-seed.js';
import { tensiItems, kegiatanItems, alumniItems, dosenItems, pengurusItems } from '../src/data/dummy.js';

export async function migrate() {
  await transaction(async client => {
    await client.query('SELECT pg_advisory_xact_lock(8749321)');
    await client.query(await readFile(new URL('./schema.sql', import.meta.url), 'utf8'));
    const seeded = await client.query("SELECT 1 FROM hme.migrations WHERE name = 'initial-content'");
    if (seeded.rowCount) return;
    const months = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',Mei:'05',Jun:'06',Jul:'07',Ags:'08',Sep:'09',Okt:'10',Nov:'11',Des:'12' };
    const groups = { tensi: tensiItems, kegiatan: [...kegiatanItems,...allKegiatan], alumni: [...alumniItems,...allAlumni], dosen: dosenItems, ...pengurusItems };
    for (const [kind, items] of Object.entries(groups)) {
      for (const item of items) {
        const data = { ...item };
        delete data.id;
        if (data.date) { const [day, month, year] = data.date.split(' '); data.date = `${year}-${months[month]}-${day.padStart(2,'0')}`; }
        if (kind === 'kegiatan') data.type = 'Lainnya';
        await client.query('INSERT INTO hme.content(kind,data) VALUES ($1,$2)', [kind, data]);
      }
    }
    await client.query('INSERT INTO hme.settings(data) VALUES ($1) ON CONFLICT DO NOTHING', [{ periode:'2025/2026',address:'FTMM Universitas Airlangga, Kampus C, Surabaya',email:'hme@ftmm.unair.ac.id',phone:'+62 812-3456-7890',instagram:'',youtube:'',linkedin:'',twitter:'' }]);
    await client.query("INSERT INTO hme.migrations(name) VALUES ('initial-content')");
  });
}
if (process.argv[1]?.endsWith('/migrate.js')) {
  try { await migrate(); console.log('Schema hme dan data awal siap.'); } finally { await pool.end(); }
}
