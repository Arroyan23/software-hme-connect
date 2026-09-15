import { useCallback, useEffect, useState } from 'react';
import { SiteContext } from '../lib/site-context';
import { api } from '../lib/api';

export default function SiteProvider({ children }) {
  const [data,setData]=useState(null);
  const [error,setError]=useState('');
  const refresh=useCallback(async () => {
    try { setData(await api('/site')); setError(''); }
    catch (e) { setError(e.message); throw e; }
  },[]);
  useEffect(() => { let active=true; api('/site').then(result => { if(active) setData(result); }).catch(e => { if(active) setError(e.message); }); return () => { active=false; }; },[]);
  if (!data) return <div className="p-12 pt-28 text-center" role="status">{error || 'Memuat data...'}{error && <button className="block mx-auto mt-4 text-[#a67c00]" onClick={() => refresh().catch(() => {})}>Coba lagi</button>}</div>;
  return <SiteContext.Provider value={{ ...data,refresh }}>{error && <div role="alert" className="fixed bottom-4 left-4 z-50 bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>}{children}</SiteContext.Provider>;
}
