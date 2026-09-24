import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { LogIn } from 'lucide-react';
import { api } from '../lib/api';
import { authLink, connectDestination } from '../lib/auth-redirect';

export default function MemberLoginPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = await api('/auth/login', { method: 'POST', body: data });
      navigate(connectDestination(search) || (result.user?.role === 'admin' ? '/dashboard' : '/ime-connect'), { replace: true });
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
        <h1 className="font-serif text-3xl mb-2">Login Member</h1>
        <p className="text-sm text-gray-500 mb-8">Masuk menggunakan email kampus yang sudah terdaftar.</p>
        <form onSubmit={submit} className="space-y-5">
          <label className="block text-sm">Email<input name="email" type="email" required autoComplete="username" className={field} /><span className="mt-1 block text-xs text-gray-500">Gunakan email kampus yang sudah terdaftar.</span></label>
          <label className="block text-sm">Password<input name="password" type="password" required autoComplete="current-password" className={field} /></label>
          {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
          <button disabled={busy} className="w-full flex justify-center items-center gap-2 rounded-xl bg-[#c9970d] px-4 py-3 font-medium disabled:opacity-50"><LogIn size={18} />{busy ? 'Memproses...' : 'Masuk'}</button>
          <Link className="block text-sm text-[#a67c00] text-center" to={authLink('/register', search)}>Belum punya akun? Daftar anggota</Link>
        </form>
      </div>
    </div>
  );
}
