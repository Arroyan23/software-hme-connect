import { useState } from "react";
import { useSite } from "../lib/site-context";
import DetailModal from "../components/DetailModal";

const categories = ["Semua", "Magang", "Beasiswa", "Lomba", "Informasi", "MSIB"];

export default function TensiPage() {
  const { tensiItems } = useSite();
  const [selected, setSelected] = useState(null);
  const [active, setActive] = useState("Semua");
  const [search, setSearch] = useState("");

  const filtered = tensiItems.filter((item) => {
    const matchCat = active === "Semua" || item.category === active || item.tag === active;
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) || item.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="pt-16 min-h-screen bg-white">
      {selected && <DetailModal item={selected} onClose={() => setSelected(null)} />}
      {/* Page header */}
      <div
        className="relative py-20 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #111111 0%, #1a1a1a 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(#c9970d 1px, transparent 1px), linear-gradient(90deg, #c9970d 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-amber-300 font-mono text-xs tracking-widest uppercase mb-3">Tenda Informasi</p>
          <h1 className="font-serif text-5xl text-white mb-4">TENSI</h1>
          <p className="text-amber-200 text-base max-w-xl">
            Kumpulan informasi magang, beasiswa, lomba, MSIB, dan peluang lainnya khusus untuk mahasiswa Teknik Elektro UNAIR.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  active === cat
                    ? "bg-[#c9970d] text-black"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Cari informasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9970d]/30 w-full sm:w-56"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-lg font-serif mb-1">Tidak ada informasi ditemukan</p>
            <p className="text-sm">Coba ubah filter atau kata kunci pencarian</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <article
                key={item.id}
                className="group border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:shadow-amber-50 hover:-translate-y-1 transition-all duration-300 cursor-pointer bg-white"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.color}`}>{item.tag}</span>
                  <span className="text-gray-400 text-xs font-mono">{item.date}</span>
                </div>
                <h3 className="font-semibold text-[#111111] text-sm leading-snug mb-2 group-hover:text-[#c9970d] transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed line-clamp-4">{item.excerpt}</p>
                <button onClick={() => setSelected(item)} className="mt-4 text-[#c9970d] text-xs font-medium hover:underline">
                  Selengkapnya →
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
