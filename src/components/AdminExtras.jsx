import { useEffect,useState } from 'react';
import { Pencil,Trash2,Plus,Check,X } from 'lucide-react';
import ContentForm from './ContentForm';
import { useSite } from '../lib/site-context';
import { api } from '../lib/api';
import { labels,fields } from '../lib/fields';

export default function AdminExtras({ tab,onEdit,onDelete,search }) {
  const site=useSite();
  const [submissions,setSubmissions]=useState([]);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [busy,setBusy]=useState(false);
  useEffect(() => { if(tab === 'kiriman') api('/submissions').then(setSubmissions).catch(e => setError(e.message)); },[tab]);
  async function review(id,status) {
    setBusy(true); setError('');
    try { await api(`/submissions/${id}/status`,{ method:'PATCH',body:{status} }); setSubmissions(await api('/submissions')); await site.refresh(); }
    catch(e) { setError(e.message); } finally { setBusy(false); }
  }
  if(tab === 'settings') return <div className="max-w-xl"><h3 className="font-semibold mb-6">Pengaturan Website</h3>{notice && <p role="status" className="text-green-700 mb-4">{notice}</p>}<ContentForm kind="settings" initial={site.settings} onSave={async body => { await api('/settings',{method:'PUT',body}); await site.refresh(); setNotice('Pengaturan tersimpan'); }}/></div>;
  if(tab === 'kiriman') return <div><h3 className="font-semibold mb-6">Kiriman Alumni & Pendaftaran Anggota</h3>{error && <p role="alert" className="text-red-700">{error}</p>}{submissions.length === 0 && <p className="text-gray-500 text-sm">Belum ada kiriman.</p>}<div className="divide-y divide-gray-100">{submissions.filter(s => JSON.stringify(s.data).toLowerCase().includes(search.toLowerCase())).map(s => <article key={s.id} className="py-5">
    <div className="flex justify-between gap-4"><h4 className="font-semibold break-words">{s.data.title || s.data.name}</h4><span className="text-xs shrink-0">{{pending:'Menunggu',approved:'Disetujui',rejected:'Ditolak'}[s.status]}</span></div>
    <dl className="text-sm mt-3 space-y-1">{Object.entries(s.data).filter(([,v]) => v).map(([k,v]) => <div key={k} className="break-words"><dt className="inline text-gray-500">{fields[s.kind === 'alumni' ? 'submit-alumni' : 'anggota'].find(f => f.name === k)?.label || k}: </dt><dd className="inline whitespace-pre-wrap">{v}</dd></div>)}</dl>
    {s.status === 'pending' && <div className="flex gap-3 mt-4"><button disabled={busy} onClick={() => review(s.id,'approved')} className="flex gap-1 items-center text-sm text-green-700"><Check size={16}/>Setujui</button><button disabled={busy} onClick={() => review(s.id,'rejected')} className="flex gap-1 items-center text-sm text-red-700"><X size={16}/>Tolak</button></div>}
  </article>)}</div></div>;
  const kinds=tab === 'struktur' ? ['petinggi','divisi'] : ['dosen'];
  return <div className="space-y-8">{kinds.map(kind => { const items=kind === 'dosen' ? site.dosenItems : site.pengurusItems[kind]; return <section key={kind}>
    <div className="flex justify-between items-center gap-3 mb-6"><h3 className="font-semibold">{labels[kind]}</h3><button onClick={() => onEdit(kind)} className="inline-flex gap-2 items-center px-4 py-2 rounded-xl bg-[#c9970d] text-sm"><Plus size={16}/>Tambah</button></div>
    {items.length === 0 && <p className="text-gray-500 text-sm">Belum ada data.</p>}
    <div className="divide-y divide-gray-100">{items.filter(item => JSON.stringify(item).toLowerCase().includes(search.toLowerCase())).map(item => <div key={item.id} className="flex items-center gap-3 py-4">
      {item.photo && <img src={item.photo} alt={item.name} className="w-12 h-12 rounded-full object-cover"/>}<div className="flex-1 min-w-0"><p className="font-medium break-words">{item.name || item.nama}</p><p className="text-xs text-gray-500">{item.jabatan || item.kepala || ''}</p></div>
      <button title="Edit" aria-label={`Edit ${item.name || item.nama}`} onClick={() => onEdit(kind,item)} className="p-2 text-[#a67c00]"><Pencil size={16}/></button><button title="Hapus" aria-label={`Hapus ${item.name || item.nama}`} onClick={() => onDelete(kind,item)} className="p-2 text-red-600"><Trash2 size={16}/></button>
    </div>)}</div>
  </section>; })}</div>;
}
