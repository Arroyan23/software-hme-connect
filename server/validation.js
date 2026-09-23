import { z } from 'zod';

const text = z.string().trim().min(1, 'Wajib diisi').max(500);
const description = z.string().trim().min(1).max(20000);
const url = z.string().max(2000).refine(v => {
  if (!v || /^\/api\/media\/[a-f0-9-]+$/.test(v)) return true;
  try { return ['http:','https:'].includes(new URL(v).protocol); } catch { return false; }
}, 'URL harus http atau https yang valid').default('');
const year = z.string().regex(/^(19|20)\d{2}$/, 'Angkatan harus empat digit');
const date = z.iso.date();
export const schemas = {
  tensi: z.object({ title: text, category: z.enum(['Magang','Beasiswa','Lomba','Informasi','MSIB']), excerpt: description, date, body: z.string().max(50000).default(''), link: url }),
  kegiatan: z.object({ title: text, date, location: text, type: z.enum(['Seminar','Workshop','Baksos','Kompetisi','Kunjungan','Lainnya']).default('Lainnya'), desc: description, image: url, link: url }),
  alumni: z.object({ name: text, angkatan: year, company: text, position: text, title: text, desc: description, type: z.enum(['Lowongan','Program','Sharing','Beasiswa']), link: url }),
  dosen: z.object({ name: text, photo: url }),
  petinggi: z.object({ name: text, jabatan: text, angkatan: year, photo: url }),
  divisi: z.object({ nama: text, kepanjangan: text, kepala: text, photo: url, anggota: z.coerce.number().int().min(0).max(10000), color: z.enum(['bg-[#c9970d]','bg-indigo-500','bg-violet-500','bg-pink-500','bg-amber-500','bg-teal-500','bg-green-500','bg-orange-500']).default('bg-[#c9970d]') }),
};
export const memberSchema = z.object({ name: text, nim: z.string().trim().regex(/^[0-9A-Za-z-]{4,30}$/), email: z.email().max(254), angkatan: year, phone: z.string().trim().min(8).max(30), motivation: description });
export const alumniSubmissionSchema = schemas.alumni.extend({ email: z.email().max(254) });
export const settingsSchema = z.object({ periode: text, address: text, email: z.email(), phone: text, instagram: url, youtube: url, linkedin: url, twitter: url });
export const registerSchema = z.object({ name: text, email: z.email().max(254).transform(v => v.toLowerCase()), password: z.string().min(12, 'Password minimal 12 karakter').max(128), inviteCode: z.string().min(1).max(200) });
const studentEmail = z.email().max(254).transform(v => v.toLowerCase()).refine(v => /ftmm-(?:19|20)\d{2}@student\.unair\.ac\.id$/i.test(v), 'Gunakan email student.unair.ac.id dengan format ...ftmm-YYYY@student.unair.ac.id');
export const memberRegisterSchema = z.object({ name: text, nim: z.string().trim().regex(/^[0-9A-Za-z-]{4,30}$/, 'NIM tidak valid'), email: studentEmail, password: z.string().min(12, 'Password minimal 12 karakter').max(128), status: z.enum(['mahasiswa','alumni']) });
export function entryYearFromEmail(email) { return email.match(/ftmm-((?:19|20)\d{2})@student\.unair\.ac\.id$/i)?.[1] || null; }
export const loginSchema = registerSchema.pick({ email: true }).extend({ password: z.string().min(1).max(128) });

export function present(row) {
  const data = { ...row.data, id: row.id };
  if (data.date) {
    data.dateISO = data.date;
    data.date = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${data.date}T00:00:00Z`));
  }
  if (row.kind === 'tensi') {
    data.tag ||= data.category;
    data.color ||= ({ Beasiswa: 'bg-green-100 text-green-700', Informasi: 'bg-purple-100 text-purple-700', MSIB: 'bg-purple-100 text-purple-700' })[data.category] || 'bg-amber-100 text-amber-800';
  }
  if (row.kind === 'alumni') data.color ||= ({ Lowongan: 'bg-red-500', Program: 'bg-navy-700', Sharing: 'bg-green-600', Beasiswa: 'bg-purple-500' })[data.type];
  return data;
}
