import { useState } from 'react';
import { Link,useLocation,useNavigate } from 'react-router';
import { LogIn,UserPlus } from 'lucide-react';
import { api } from '../lib/api';
import { authLink, connectDestination } from '../lib/auth-redirect';

export default function AuthPage({ register=false, adminRegister=false }) {
  const navigate=useNavigate();
  const { search } = useLocation();
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    const data=Object.fromEntries(new FormData(event.currentTarget));
    if (register && data.password !== data.confirmPassword) { setError('Konfirmasi password tidak sama'); setBusy(false); return; }
    try {
      const result = await api(`/auth/${register ? (adminRegister ? 'register' : 'register-member') : 'login'}`,{ method:'POST',body:data });
      navigate(connectDestination(search) || (result.user?.role === 'admin' ? '/dashboard' : '/ime-connect'), { replace:true });
    }
    catch(e) { setError(e.message); } finally { setBusy(false); }
  }
  const field='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9970d]/30';
  return <div className="pt-28 pb-16 px-4 min-h-screen bg-[#fffbeb]">
    <div className="max-w-md mx-auto">
      <p className="text-[#a67c00] font-mono text-xs uppercase mb-2">HME UA</p>
      <h1 className="font-serif text-3xl mb-8">{register ? (adminRegister ? 'Daftar Admin' : 'Daftar Anggota') : 'Masuk'}</h1>
      <form onSubmit={submit} className="space-y-5">
        {register && <label className="block text-sm">Nama lengkap<input name="name" required autoComplete="name" className={field} /></label>}
        {register && !adminRegister && <label className="block text-sm">NIM<input name="nim" required autoComplete="off" className={field} /></label>}
        <label className="block text-sm">Email{register && !adminRegister && <span className="ml-1 text-xs text-gray-500">(...ftmm-YYYY@student.unair.ac.id)</span>}<input name="email" type="email" required autoComplete="username" className={field} /></label>
        <label className="block text-sm">Password<input name="password" type="password" required minLength={register ? 12 : 1} maxLength={128} autoComplete={register ? 'new-password' : 'current-password'} className={field} /></label>
        {register && <label className="block text-sm">Konfirmasi password<input name="confirmPassword" type="password" required minLength={12} autoComplete="new-password" className={field} /></label>}
        {register && !adminRegister && <label className="block text-sm">Status<select name="status" defaultValue="mahasiswa" className={field}><option value="mahasiswa">Mahasiswa</option><option value="alumni">Alumni</option></select></label>}
        {register && adminRegister && <label className="block text-sm">Kode undangan admin<input name="inviteCode" type="password" required autoComplete="off" className={field} /></label>}
        {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
        <button disabled={busy} className="w-full flex justify-center items-center gap-2 rounded-xl bg-[#c9970d] px-4 py-3 font-medium disabled:opacity-50">{register ? <UserPlus size={18}/> : <LogIn size={18}/>} {busy ? 'Memproses...' : register ? 'Daftar' : 'Masuk'}</button>
        <Link className="block text-sm text-[#a67c00] text-center" to={authLink(register ? '/login' : '/register', search)}>{register ? 'Sudah punya akun? Masuk' : 'Daftar anggota baru'}</Link>
        {!register && <Link className="block text-xs text-gray-500 text-center" to="/admin/register">Daftar admin</Link>}
      </form>
    </div>
  </div>;
}
