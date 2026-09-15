import { useSite } from "../lib/site-context";
import { useState } from "react";
import DetailModal from "../components/DetailModal";



export default function KegiatanPage() {
  const { kegiatanItems: allKegiatan } = useSite();
  const [selected,setSelected] = useState(null);
  return (
    <div className="pt-16 min-h-screen bg-white">
      {selected && <DetailModal item={selected} onClose={() => setSelected(null)} />}
      {/* Header */}
      <div
        className="relative py-20 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #111111 0%, #242424 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, #e6c25a 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-amber-300 font-mono text-xs tracking-widest uppercase mb-3">Agenda Himpunan</p>
          <h1 className="font-serif text-5xl text-white mb-4">Kegiatan HME UA</h1>
          <p className="text-amber-200 text-base max-w-xl">
            Rangkaian program dan kegiatan himpunan — dari seminar nasional, pelatihan teknis, hingga pengabdian masyarakat.
          </p>
        </div>
      </div>

      {allKegiatan.length === 0 && <p className="text-center py-12 text-gray-500">Belum ada kegiatan.</p>}
      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {allKegiatan.map((item, i) => (
            <article
              key={item.id}
              role="button" tabIndex={0} onClick={() => setSelected(item)} onKeyDown={e => { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(item); } }}
              className={`group rounded-3xl overflow-hidden border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer ${i === 0 ? "sm:col-span-2 lg:col-span-1" : ""}`}
            >
              <div className="relative h-52 overflow-hidden bg-gray-100">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[#111111] text-xs font-mono">
                    {item.date}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-semibold text-[#111111] text-base leading-snug mb-2 group-hover:text-[#c9970d] transition-colors">
                  {item.title}
                </h3>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-3">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {item.location}
                </div>
                <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">{item.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
