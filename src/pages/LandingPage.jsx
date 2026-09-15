import { Link } from "react-router";
import { useSite } from "../lib/site-context";
import { useState } from "react";
import DetailModal from "../components/DetailModal";

// ── Hero ────────────────────────────────────────────────────────────────────
function Hero() {
  const { settings,dashboardStats } = useSite();
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #111111 50%, #1a1a1a 100%)" }}
    >
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "linear-gradient(#c9970d 1px, transparent 1px), linear-gradient(90deg, #c9970d 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow blob */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#c9970d]/15 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-amber-300 text-xs font-mono tracking-widest uppercase">Kepengurusan {settings.periode}</span>
        </div>

        <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-white leading-tight mb-6">
          Himpunan Mahasiswa<br />
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg, #e6c25a, #c9970d)" }}>
            Teknik Elektro
          </span>
        </h1>
        <p className="text-amber-200 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
          Universitas Airlangga — Fakultas Teknologi Maju dan Multidisiplin. Bersama bertumbuh, berinovasi, dan memberikan dampak nyata.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/kegiatan"
            className="px-6 py-3 rounded-xl bg-[#c9970d] hover:bg-[#a67c00] text-black font-semibold text-sm transition-all hover:shadow-lg hover:shadow-amber-500/25"
          >
            Lihat Kegiatan
          </Link>
          <Link
            to="/tensi"
            className="px-6 py-3 rounded-xl border border-amber-400/40 hover:border-amber-400/80 text-amber-200 hover:text-white font-semibold text-sm transition-all"
          >
            Buka TENSI
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto">
          {[
            { label: "Anggota Aktif", value: dashboardStats.totalAnggota },
            { label: "Divisi", value: dashboardStats.totalDivisi },
            { label: "Kegiatan", value: dashboardStats.totalKegiatan },
            { label: "Info Alumni", value: dashboardStats.totalAlumni },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-white font-serif">{s.value}</p>
              <p className="text-amber-300 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-amber-400/60">
        <span className="text-xs font-mono">scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-amber-400/60 to-transparent" />
      </div>
    </section>
  );
}

// ── TENSI Section ────────────────────────────────────────────────────────────
function TensiSection() {
  const [selected, setSelected] = useState(null);
  const { tensiItems } = useSite();
  return (
    <>{selected && <DetailModal item={selected} onClose={() => setSelected(null)} />}<section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[#c9970d] font-mono text-xs tracking-widest uppercase mb-2">Informasi Terkini</p>
            <h2 className="font-serif text-4xl text-[#111111]">TENSI</h2>
            <p className="text-gray-500 text-sm mt-1">Tenda Informasi — magang, beasiswa, lomba & lebih</p>
          </div>
          <Link
            to="/tensi"
            className="hidden sm:inline-flex items-center gap-2 text-[#c9970d] text-sm font-medium hover:underline"
          >
            Lihat semua
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tensiItems.slice(0, 3).map((item) => (
            <article
              key={item.id}
              role="button" tabIndex={0} onClick={() => setSelected(item)} onKeyDown={e => { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(item); } }}
              className="group border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:shadow-amber-50 hover:-translate-y-1 transition-all duration-300 cursor-pointer bg-white"
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.color}`}>{item.tag}</span>
                <span className="text-gray-400 text-xs font-mono">{item.date}</span>
              </div>
              <h3 className="font-semibold text-[#111111] text-sm leading-snug mb-2 group-hover:text-[#c9970d] transition-colors">
                {item.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">{item.excerpt}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link to="/tensi" className="text-[#c9970d] text-sm font-medium hover:underline">
            Lihat semua informasi →
          </Link>
        </div>
      </div>
    </section></>
  );
}

// ── Kegiatan Section ─────────────────────────────────────────────────────────
function KegiatanSection() {
  const [selected, setSelected] = useState(null);
  const { kegiatanItems } = useSite();
  if (!kegiatanItems.length) return null;
  return (
    <>{selected && <DetailModal item={selected} onClose={() => setSelected(null)} />}<section className="py-20 bg-[#fffbeb]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[#c9970d] font-mono text-xs tracking-widest uppercase mb-2">Agenda Himpunan</p>
            <h2 className="font-serif text-4xl text-[#111111]">Kegiatan Terbaru</h2>
          </div>
          <Link
            to="/kegiatan"
            className="hidden sm:inline-flex items-center gap-2 text-[#c9970d] text-sm font-medium hover:underline"
          >
            Lihat semua
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Featured */}
          <div role="button" tabIndex={0} onClick={() => setSelected(kegiatanItems[0])} onKeyDown={e => { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(kegiatanItems[0]); } }} className="group relative rounded-3xl overflow-hidden cursor-pointer" style={{ minHeight: 420 }}>
            <img
              src={kegiatanItems[0].image}
              alt={kegiatanItems[0].title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <span className="inline-block px-2.5 py-1 rounded-full bg-[#c9970d] text-black text-xs font-medium mb-3">
                {kegiatanItems[0].date}
              </span>
              <h3 className="text-white font-serif text-2xl leading-snug mb-2">{kegiatanItems[0].title}</h3>
              <p className="text-gray-300 text-sm line-clamp-3">{kegiatanItems[0].desc}</p>
            </div>
          </div>

          {/* Side list */}
          <div className="space-y-4">
            {kegiatanItems.slice(1, 4).map((item) => (
              <div
                key={item.id}
              role="button" tabIndex={0} onClick={() => setSelected(item)} onKeyDown={e => { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(item); } }}
                className="group flex gap-4 p-4 rounded-2xl hover:bg-white hover:shadow-md transition-all cursor-pointer"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[#c9970d] text-xs font-mono">{item.date}</span>
                  <h3 className="text-[#111111] font-semibold text-sm leading-snug mt-0.5 mb-1 group-hover:text-[#c9970d] transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section></>
  );
}

// ── Alumni Section ────────────────────────────────────────────────────────────
function AlumniSection() {
  const [selected, setSelected] = useState(null);
  const { alumniItems } = useSite();
  return (
    <>{selected && <DetailModal item={selected} onClose={() => setSelected(null)} />}<section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[#c9970d] font-mono text-xs tracking-widest uppercase mb-2">Ikatan Alumni Elektro</p>
            <h2 className="font-serif text-4xl text-[#111111]">Info Alumni</h2>
            <p className="text-gray-500 text-sm mt-1">Lowongan kerja, program, dan sharing dari alumni HME UA</p>
          </div>
          <Link to="/alumni" className="hidden sm:inline-flex items-center gap-2 text-[#c9970d] text-sm font-medium hover:underline">
            Lihat semua
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {alumniItems.slice(0,3).map((item) => (
            <div
              key={item.id}
              role="button" tabIndex={0} onClick={() => setSelected(item)} onKeyDown={e => { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(item); } }}
              className="group border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-navy-950/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <div className={`h-2 ${item.color}`} />
              <div className="p-6">
                <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-mono mb-4">{item.type}</span>
                <h3 className="font-semibold text-[#111111] text-sm leading-snug mb-2 group-hover:text-[#c9970d] transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-5">{item.desc}</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9970d] to-[#a67c00] flex items-center justify-center text-black text-xs font-bold">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.position} · {item.company}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section></>
  );
}

// ── Dosen Section ─────────────────────────────────────────────────────────────
function DosenSection() {
  const { dosenItems } = useSite();
  return (
    <section className="py-20" style={{ background: "linear-gradient(135deg, #111111 0%, #1a1a1a 100%)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-amber-300 font-mono text-xs tracking-widest uppercase mb-2">Tenaga Pengajar</p>
          <h2 className="font-serif text-4xl text-white">Dosen Teknik Elektro</h2>
          <p className="text-amber-200 text-sm mt-2">Fakultas Teknologi Maju dan Multidisiplin — Universitas Airlangga</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6 justify-items-center">
          {dosenItems.map((dosen) => (
            <div key={dosen.id} className="group flex flex-col items-center text-center gap-3 cursor-pointer">
              <div className="relative">
                <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-[#c9970d] transition-all duration-300">
                  <img
                    src={dosen.photo}
                    alt={dosen.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="absolute inset-0 rounded-full bg-[#c9970d]/0 group-hover:bg-[#c9970d]/10 transition-colors duration-300" />
              </div>
              <p className="text-amber-100 text-xs leading-snug line-clamp-2 w-20">{dosen.name}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-amber-400/60 text-xs font-mono mt-10">
          {dosenItems.length} dosen · Teknik Elektro FTMM UNAIR
        </p>
      </div>
    </section>
  );
}

// ── Struktur Organisasi ────────────────────────────────────────────────────────
function StrukturSection() {
  const { pengurusItems,settings } = useSite();
  const { petinggi, divisi } = pengurusItems;

  return (
    <section className="py-20 bg-[#fffbeb]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-[#c9970d] font-mono text-xs tracking-widest uppercase mb-2">Kepengurusan {settings.periode}</p>
          <h2 className="font-serif text-4xl text-[#111111]">Struktur Himpunan</h2>
        </div>

        {/* Petinggi */}
        <div className="mb-12">
          <p className="text-center text-gray-500 text-xs font-mono uppercase tracking-wider mb-6">Pimpinan Himpunan</p>
          <div className="flex flex-wrap justify-center gap-4">
            {petinggi.map((p) => (
              <div
                key={p.jabatan}
                className="text-center px-6 py-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow min-w-[140px]"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9970d] to-[#111111] flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
                  {p.name.split(" ")[1]?.charAt(0) ?? p.name.charAt(0)}
                </div>
                <p className="text-[#c9970d] text-xs font-mono mb-1">{p.jabatan}</p>
                <p className="text-[#111111] font-semibold text-sm leading-snug">{p.name}</p>
                <p className="text-gray-400 text-xs mt-0.5">Angkatan {p.angkatan}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Divisi */}
        <div>
          <p className="text-center text-gray-500 text-xs font-mono uppercase tracking-wider mb-6">Divisi</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {divisi.map((d) => (
              <div
                key={d.nama}
                className="group rounded-2xl bg-white border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                <div className={`w-8 h-8 rounded-lg ${d.color} flex items-center justify-center mb-3`}>
                  <span className="text-white text-xs font-bold">{d.nama.charAt(0)}</span>
                </div>
                <p className="text-[#111111] font-bold text-sm">{d.nama}</p>
                <p className="text-gray-400 text-xs leading-snug mt-0.5 mb-3">{d.kepanjangan}</p>
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-[10px]">Kepala Divisi</p>
                    <p className="text-[#111111] text-xs font-medium">{d.kepala}</p>
                  </div>
                  <span className="text-[#c9970d] font-mono text-xs">{d.anggota}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── CTA Banner ────────────────────────────────────────────────────────────────
function CTABanner() {
  return (
    <section
      className="py-20 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #a67c00 0%, #c9970d 50%, #d9a921 100%)" }}
    >
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
        <h2 className="font-serif text-4xl text-black mb-4">Bergabunglah dengan HME UA</h2>
        <p className="text-black/70 text-base mb-8 leading-relaxed">
          Jadilah bagian dari komunitas mahasiswa teknik elektro yang aktif, inovatif, dan berdampak di Universitas Airlangga.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="/daftar-anggota"
            className="px-6 py-3 rounded-xl bg-black text-[#e6c25a] font-semibold text-sm hover:bg-[#1a1a1a] transition-colors"
          >
            Daftar Anggota Baru
          </a>
          <Link
            to="/kegiatan"
            className="px-6 py-3 rounded-xl border border-black/50 text-black font-semibold text-sm hover:bg-black/10 transition-colors"
          >
            Lihat Kegiatan
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <>
      <Hero />
      <TensiSection />
      <KegiatanSection />
      <AlumniSection />
      <DosenSection />
      <StrukturSection />
      <CTABanner />
    </>
  );
}
