import { useState,useEffect,useRef } from 'react';
import { Upload,Save,X } from 'lucide-react';
import { api } from '../lib/api';
import { fields } from '../lib/fields';

export default function ContentForm({ kind,initial={},onSave,onCancel,submitLabel='Simpan' }) {
  const [values,setValues]=useState(() => Object.fromEntries(fields[kind].map(f => [f.name,f.name === 'date' ? initial.dateISO || initial.date || new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10) : initial[f.name] ?? f.options?.[0] ?? ''])));
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [uploading,setUploading]=useState(false);
  const change=(name,value) => setValues(v => ({...v,[name]:value}));
  async function upload(name,file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Ukuran gambar maksimal 5 MB.'); return; }
    setUploading(true); setError('');
    try { const form=new FormData(); form.append('file',file); const data=await api('/media',{method:'POST',body:form}); change(name,data.url); }
    catch(e) { setError(e.message); } finally { setUploading(false); }
  }
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try { await onSave(values); } catch(e) { setError(e.message); } finally { setBusy(false); }
  }
  const inputClass='w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9970d]/30 bg-white';
  return <form className="space-y-4" onSubmit={submit}>
    <fieldset disabled={busy || uploading} className="space-y-4 disabled:opacity-60">
      {fields[kind].map(f => <div key={f.name}>
        <label htmlFor={`field-${f.name}`} className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
        {f.type === 'select' ? <select id={`field-${f.name}`} name={f.name} className={inputClass} value={values[f.name]} onChange={e => change(f.name,e.target.value)}>{f.options.map(v => <option key={v}>{v}</option>)}</select>
          : f.type === 'color' ? <div className="flex gap-2" role="radiogroup" aria-label={f.label}>{f.options.map(color => <button key={color} type="button" role="radio" aria-checked={values[f.name] === color} aria-label={color} title={color} onClick={() => change(f.name,color)} className={`w-8 h-8 rounded-full ${color} ${values[f.name] === color ? 'ring-2 ring-offset-2 ring-gray-800' : ''}`} />)}</div>
          : f.type.includes('textarea') ? <textarea id={`field-${f.name}`} name={f.name} rows={4} maxLength={f.name === 'body' ? 50000 : 20000} required={!f.type.startsWith('optional')} className={inputClass} value={values[f.name]} onChange={e => change(f.name,e.target.value)} />
          : <input id={`field-${f.name}`} name={f.name} type={f.type === 'image' ? 'text' : f.type.replace('optional-','')} min={f.type === 'number' ? 0 : undefined} max={f.type === 'number' ? 10000 : undefined} pattern={f.name === 'angkatan' ? '(19|20)[0-9]{2}' : undefined} required={!f.type.startsWith('optional') && f.type !== 'image'} className={inputClass} value={values[f.name]} onChange={e => change(f.name,e.target.value)} />}
        {f.type === 'image' && <div className="mt-2 space-y-3">
          <div className="flex flex-wrap items-center gap-3"><label className="text-xs text-[#a67c00] flex items-center gap-2 cursor-pointer"><Upload size={16}/>{uploading ? 'Mengunggah...' : 'Unggah gambar'}<input aria-label={`Unggah ${f.label}`} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e => { upload(f.name,e.target.files[0]); e.target.value=''; }}/></label>
          {values[f.name] && <button type="button" onClick={() => change(f.name,'')} className="inline-flex items-center gap-1 text-xs text-red-700"><X size={14}/>Lepas foto</button>}</div>
          {values[f.name] && <img src={values[f.name]} alt={`Pratinjau ${f.label}`} className={kind === 'divisi' ? 'w-full aspect-video object-cover rounded-lg' : 'w-24 h-24 object-cover rounded-lg'}/>}
          <p className="text-xs text-gray-500">JPEG, PNG, atau WebP. Maksimal 5 MB.</p>
        </div>}
      </div>)}
    </fieldset>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <div className="flex gap-3 pt-2">
      {onCancel && <button type="button" disabled={busy || uploading} onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Batal</button>}
      <button disabled={busy || uploading} className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl bg-[#c9970d] text-black text-sm font-medium disabled:opacity-50"><Save size={16}/>{busy ? 'Menyimpan...' : submitLabel}</button>
    </div>
  </form>;
}

export function FormModal({title,onClose,children}) {
  const dialog=useRef(null);
  useEffect(() => {
    const previous=document.activeElement;
    const overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    dialog.current?.focus();
    return () => { document.body.style.overflow=overflow; previous?.focus(); };
  },[]);
  function keyDown(e) {
    if(e.key === 'Escape') { e.stopPropagation(); onClose(); }
    if(e.key !== 'Tab') return;
    const controls=[...dialog.current.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]')].filter(el => el.getClientRects().length);
    const first=controls[0], last=controls.at(-1);
    if(!first) { e.preventDefault(); return; }
    if(e.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { e.preventDefault(); first.focus(); }
  }
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
    <section ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} onKeyDown={keyDown} className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-lg max-h-[90dvh] overflow-y-auto outline-none" onClick={e => e.stopPropagation()}>
      <div className="flex items-start justify-between gap-4 mb-6"><h2 className="font-serif text-2xl text-[#111111]">{title}</h2><button type="button" title="Tutup" aria-label="Tutup" onClick={onClose} className="p-1 shrink-0"><X size={20}/></button></div>
      {children}
    </section>
  </div>;
}
