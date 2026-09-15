import { useState } from "react";
import { useSite } from "../lib/site-context";
import { api } from "../lib/api";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { LogOut } from "lucide-react";
import ContentForm, { FormModal } from "../components/ContentForm";
import AdminExtras from "../components/AdminExtras";
import { labels } from "../lib/fields";

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }) {
  return (
    <div className={`rounded-2xl p-5 text-white ${color} relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
      <div className="relative z-10">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4">{icon}</div>
        <p className="text-3xl font-bold font-mono">{value}</p>
        <p className="text-sm opacity-80 mt-1">{label}</p>
      </div>
    </div>
  );
}

// ── Tab: TENSI ────────────────────────────────────────────────────────────────
function TensiTab({ onAdd, onEdit, onDelete, items: tensiItems }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-[#111111]">Data TENSI</h3>
          <p className="text-gray-400 text-sm">{tensiItems.length} informasi tersimpan</p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c9970d] text-black text-sm font-medium hover:bg-[#a67c00] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Info
        </button>
      </div>
      <div className="rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Judul</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Kategori</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Tanggal</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tensiItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-4">
                  <p className="font-medium text-[#111111] line-clamp-1">{item.title}</p>
                  <p className="text-gray-400 text-xs mt-0.5 line-clamp-1 sm:hidden">{item.date}</p>
                </td>
                <td className="px-5 py-4 hidden md:table-cell">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.color}`}>{item.tag}</span>
                </td>
                <td className="px-5 py-4 hidden sm:table-cell">
                  <span className="text-gray-400 font-mono text-xs">{item.date}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 justify-end">
                    <button title="Edit" aria-label={`Edit ${item.title}`} onClick={() => onEdit(item)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#c9970d] hover:bg-amber-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button title="Hapus" aria-label={`Hapus ${item.title}`} onClick={() => onDelete(item)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: Kegiatan ─────────────────────────────────────────────────────────────
function KegiatanTab({ onAdd, onEdit, onDelete, items: kegiatanItems }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-[#111111]">Data Kegiatan</h3>
          <p className="text-gray-400 text-sm">{kegiatanItems.length} kegiatan tersimpan</p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c9970d] text-black text-sm font-medium hover:bg-[#a67c00] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Kegiatan
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {kegiatanItems.map((item) => (
          <div key={item.id} className="group flex gap-4 border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow">
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[#111111] text-sm line-clamp-1">{item.title}</p>
              <p className="text-gray-400 text-xs mt-0.5">{item.date} · {item.location}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => onEdit(item)} className="text-xs text-[#c9970d] hover:underline">Edit</button>
                <button onClick={() => onDelete(item)} className="text-xs text-red-400 hover:underline">Hapus</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Alumni ───────────────────────────────────────────────────────────────
function AlumniTab({ onAdd, onEdit, onDelete, items: alumniItems }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-[#111111]">Data Info Alumni</h3>
          <p className="text-gray-400 text-sm">{alumniItems.length} informasi tersimpan</p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c9970d] text-black text-sm font-medium hover:bg-[#a67c00] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Info
        </button>
      </div>
      <div className="space-y-3">
        {alumniItems.map((item) => (
          <div key={item.id} className="flex items-center gap-4 border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9970d] to-[#111111] flex items-center justify-center text-white font-bold text-sm shrink-0">
              {item.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-[#111111] text-sm">{item.name}</p>
                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-mono">{item.type}</span>
              </div>
              <p className="text-gray-500 text-sm line-clamp-1 mt-0.5">{item.title}</p>
              <p className="text-gray-400 text-xs">{item.position} · {item.company}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button title="Edit" aria-label={`Edit ${item.title}`} onClick={() => onEdit(item)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#c9970d] hover:bg-amber-50 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button title="Hapus" aria-label={`Hapus ${item.title}`} onClick={() => onDelete(item)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const site = useSite();
  const { dashboardStats } = site;
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  useEffect(() => { api('/auth/me').then(setUser).catch(e => setError(e.message)); }, []);
  const edit = (kind, item) => { setModal({kind, item}); setError(""); };
  const remove = (kind, item) => { setDeleting({kind, item}); setError(""); };
  const filtered = items => items.filter(item => JSON.stringify(item).toLowerCase().includes(search.toLowerCase()));
  async function save(body) {
    await api(`/${modal.kind}${modal.item ? '/'+modal.item.id : ''}`, {method: modal.item ? 'PUT' : 'POST', body});
    setModal(null);
    setNotice('Data berhasil disimpan');
    await site.refresh();
  }
  async function confirmDelete() {
    setDeleteBusy(true);
    try {
      await api(`/${deleting.kind}/${deleting.item.id}`, {method:'DELETE'});
      setDeleting(null); setNotice('Data berhasil dihapus'); await site.refresh();
    } catch(e) { setError(e.message); } finally { setDeleteBusy(false); }
  }
  async function logout() {
    try { await api('/auth/logout',{method:'POST'}); navigate('/login'); }
    catch(e) { setError(e.message); }
  }
  const [tab, setTab] = useState("tensi");
  const [modal, setModal] = useState(null);

  const tabs = [
    { id: "tensi", label: "TENSI" },
    { id: "kegiatan", label: "Kegiatan" },
    { id: "alumni", label: "Info Alumni" },
  ];

  const extraTabs = [{id:'dosen',label:'Dosen'},{id:'struktur',label:'Struktur Organisasi'},{id:'kiriman',label:'Kiriman'},{id:'settings',label:'Pengaturan'}];
  return (
    <div className="pt-16 min-h-screen bg-[#fffbeb]">
      {/* Sidebar + Content layout */}
      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-[#111111] shrink-0">
          <div className="p-6 border-b border-white/10">
            <p className="text-amber-300 font-mono text-xs uppercase tracking-widest">Admin Panel</p>
            <p className="text-white font-serif text-xl mt-1">HME UA</p>
          </div>
          <nav className="p-4 flex-1">
            <p className="text-amber-400/60 text-[10px] font-mono uppercase tracking-widest px-2 mb-2">Konten</p>
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium mb-1 transition-colors ${
                  tab === t.id
                    ? "bg-[#c9970d] text-black"
                    : "text-amber-200 hover:bg-white/5 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
            <div className="mt-4">
              <p className="text-amber-400/60 text-[10px] font-mono uppercase tracking-widest px-2 mb-2">Lainnya</p>
              {extraTabs.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium mb-1 text-amber-300/60 hover:bg-white/5 hover:text-amber-200 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-[#c9970d] flex items-center justify-center text-black text-xs font-bold">A</div>
              <div>
                <p className="text-white text-xs font-medium">{user?.name || "Admin"}</p>
                <p className="text-amber-400 text-[10px]">{site.settings.periode}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0 overflow-auto">
          {/* Top bar */}
          <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
            <div>
              <h1 className="font-semibold text-[#111111] text-lg">Dashboard Konten</h1>
              <p className="text-gray-400 text-xs font-mono">Kepengurusan {site.settings.periode}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <input
                  type="text"
                  placeholder="Cari..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9970d]/30 w-48"
                />
              </div>
              <button title={`Kiriman menunggu: ${dashboardStats.pending}`} aria-label="Kiriman menunggu" onClick={() => setTab("kiriman")} className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 lg:p-8">
            <div className="flex justify-end mb-4"><button title="Keluar" onClick={logout} className="inline-flex items-center gap-2 text-sm text-gray-600"><LogOut size={16}/>Keluar</button></div>
            {error && <p role="alert" className="text-red-700 mb-4">{error}</p>}
            {notice && <p role="status" className="text-green-700 mb-4">{notice}</p>}
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Total Info TENSI"
                value={dashboardStats.totalTensi}
                color="bg-gradient-to-br from-[#c9970d] to-[#a67c00]"
                icon={<svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              />
              <StatCard
                label="Kegiatan Aktif"
                value={dashboardStats.totalKegiatan}
                color="bg-gradient-to-br from-[#059669] to-[#047857]"
                icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              />
              <StatCard
                label="Info Alumni"
                value={dashboardStats.totalAlumni}
                color="bg-gradient-to-br from-[#7c3aed] to-[#6d28d9]"
                icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
              />
              <StatCard
                label="Total Anggota"
                value={dashboardStats.totalAnggota}
                color="bg-gradient-to-br from-[#111111] to-[#000000]"
                icon={<svg className="w-5 h-5 text-[#e6c25a]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              />
            </div>

            {/* Tab switcher (mobile) */}
            <div className="lg:hidden flex flex-wrap gap-2 mb-6">
              {[...tabs,...extraTabs].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    tab === t.id ? "bg-[#c9970d] text-black" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-100"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content card */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 lg:p-8">
              {/* Desktop tabs */}
              <div className="hidden lg:flex gap-1 border-b border-gray-100 mb-8 -mt-2">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                      tab === t.id
                        ? "border-[#c9970d] text-[#c9970d]"
                        : "border-transparent text-gray-400 hover:text-gray-700"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === "tensi" && <TensiTab items={filtered(site.tensiItems)} onAdd={() => edit("tensi")} onEdit={item => edit("tensi", item)} onDelete={item => remove("tensi",item)} />}
              {tab === "kegiatan" && <KegiatanTab items={filtered(site.kegiatanItems)} onAdd={() => edit("kegiatan")} onEdit={item => edit("kegiatan", item)} onDelete={item => remove("kegiatan",item)} />}
              {extraTabs.some(t => t.id === tab) && <AdminExtras tab={tab} onEdit={edit} onDelete={remove} search={search} />}
              {tab === "alumni" && <AlumniTab items={filtered(site.alumniItems)} onAdd={() => edit("alumni")} onEdit={item => edit("alumni", item)} onDelete={item => remove("alumni",item)} />}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal && <FormModal title={`${modal.item ? 'Edit' : 'Tambah'} ${labels[modal.kind]}`} onClose={() => setModal(null)}><ContentForm key={modal.kind + (modal.item?.id || 'new')} kind={modal.kind} initial={modal.item} onSave={save} onCancel={() => setModal(null)} /></FormModal>}
      {deleting && <FormModal title="Hapus data?" onClose={() => { if(!deleteBusy) setDeleting(null); }}><p className="text-sm mb-6">{deleting.item.title || deleting.item.name || deleting.item.nama}</p>{error && <p role="alert" className="text-red-700 mb-4">{error}</p>}<div className="flex gap-3"><button disabled={deleteBusy} onClick={() => setDeleting(null)} className="border rounded-xl px-4 py-2">Batal</button><button disabled={deleteBusy} onClick={confirmDelete} className="bg-red-600 text-white rounded-xl px-4 py-2">{deleteBusy ? 'Menghapus...' : 'Hapus'}</button></div></FormModal>}
    </div>
  );
}
