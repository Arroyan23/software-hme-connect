import { useState } from 'react';
import { Link } from 'react-router';
import ContentForm from '../components/ContentForm';
import { api } from '../lib/api';
import { labels } from '../lib/fields';

export default function SubmissionPage({ kind }) {
  const [sent,setSent]=useState(false);
  return <div className="pt-28 pb-16 px-4 min-h-screen bg-[#fffbeb]"><div className="max-w-lg mx-auto"><h1 className="font-serif text-3xl mb-8">{labels[kind]}</h1>
    {sent ? <div role="status"><p>Terima kasih. Data berhasil dikirim dan menunggu peninjauan pengurus.</p><Link to="/" className="block mt-6 text-[#a67c00]">Kembali ke beranda</Link></div> : <ContentForm kind={kind} submitLabel="Kirim" onSave={async body => { await api(`/submissions/${kind === 'submit-alumni' ? 'alumni' : 'anggota'}`,{ method:'POST',body }); setSent(true); }} />}
  </div></div>;
}
