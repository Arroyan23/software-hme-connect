import { useSite } from "../lib/site-context";
import { useState } from "react";
import DetailModal from "../components/DetailModal";



export default function AlumniPage() {
  const { alumniItems: allAlumni } = useSite();
  const [selected,setSelected] = useState(null);
  return (
    <div className="pt-16 min-h-screen bg-white">
      {selected && <DetailModal item={selected} onClose={() => setSelected(null)} />}
      {/* Header */}
      <div
        className="relative py-20 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #111111 60%, #2e2e2e 100%)" }}
      >
        <div
          className="absolute right-0 top-0 w-96 h-96 opacity-20"
          style={{
            background: "radial-gradient(circle at center, #c9970d 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-amber-300 font-mono text-xs tracking-widest uppercase mb-3">Ikatan Alumni Elektro</p>
          <h1 className="font-serif text-5xl text-white mb-4">Info Alumni</h1>
          <p className="text-amber-200 text-base max-w-xl">
            Lowongan kerja, program karir, beasiswa lanjutan, dan sharing session dari jaringan alumni HME UA yang tersebar di seluruh industri.
          </p>
        </div>
      </div>

      {/* Highlight banner */}
      <div className="bg-[#fffbeb] border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[#c9970d] animate-pulse" />
          <p className="text-[#111111] text-sm">
            <span className="font-semibold">Kamu alumni HME UA?</span> Bagikan informasi karir dan peluang untuk adik-adik angkatan.{" "}
            <a href="/alumni/kirim" className="text-[#c9970d] font-medium hover:underline">Kirim info →</a>
          </p>
        </div>
      </div>

      {allAlumni.length === 0 && <p className="text-center py-12 text-gray-500">Belum ada info alumni.</p>}
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allAlumni.map((item) => (
            <div
              key={item.id}
              role="button" tabIndex={0} onClick={() => setSelected(item)} onKeyDown={e => { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(item); } }}
              className="group border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-navy-950/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer bg-white"
            >
              <div className={`h-1.5 ${item.color}`} />
              <div className="p-6">
                <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-mono mb-4">{item.type}</span>
                <h3 className="font-semibold text-[#111111] text-sm leading-snug mb-2 group-hover:text-[#c9970d] transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-5">{item.desc}</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c9970d] to-[#111111] flex items-center justify-center text-white text-sm font-bold">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.position} · Angkatan {item.angkatan}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
