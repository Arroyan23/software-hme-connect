import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { UserPlus } from 'lucide-react';
import { api } from '../lib/api';

export default function MemberRegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (data.password !== data.confirmPassword) {
      setError('Konfirmasi password tidak sama');
      setBusy(false);
      return;
    }
    try {
      await api('/auth/register-member', { method: 'POST', body: data });
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  const field = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9970d]/30';

  return (
    <div className="pt-28 pb-16 px-4 min-h-screen bg-[#fffbeb]">
      <div className="max-w-md mx-auto">
        <p className="text-[#a67c00] font-mono text-xs uppercase mb-2">HME UA</p>
        <h1 className="font-serif text-3xl mb-2">Daftar Anggota</h1>
        <form onSubmit={submit} className="space-y-5">
          <label className="block text-sm">Nama lengkap<input name="name" required autoComplete="name" className={field} /></label>
          <label className="block text-sm">NIM<input name="nim" required autoComplete="off" className={field} /></label>
          <label className="block text-sm">Email<input name="email" type="email" required autoComplete="username" className={field} /><span className="mt-1 block text-xs text-gray-500">Gunakan email kampus dengan domain @student.unair.ac.id.</span></label>
          <label className="block text-sm">Password<input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" className={field} /></label>
          <label className="block text-sm">Konfirmasi password<input name="confirmPassword" type="password" required minLength={12} autoComplete="new-password" className={field} /></label>
          <label className="block text-sm">Status<select name="status" defaultValue="mahasiswa" className={field}><option value="mahasiswa">Mahasiswa</option><option value="alumni">Alumni</option></select></label>
          {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
          <button disabled={busy} className="w-full flex justify-center items-center gap-2 rounded-xl bg-[#c9970d] px-4 py-3 font-medium disabled:opacity-50"><UserPlus size={18} />{busy ? 'Memproses...' : 'Daftar'}</button>
          <Link className="block text-sm text-[#a67c00] text-center" to="/member/login">Sudah punya akun? Masuk</Link>
        </form>
      </div>
    </div>
  );
}
