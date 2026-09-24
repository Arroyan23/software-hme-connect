import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  Bookmark, Folder, GraduationCap, Heart, House, MessageCircle, Newspaper,
  Search, Share2, UserRound, UsersRound, Zap,
} from "lucide-react";

const trending = [
  ["LPDP2026", "234 postingan"], ["MagangPLN", "189 postingan"],
  ["OpenRekrutHIMATEL", "156 postingan"], ["UTSGasal2026", "98 postingan"],
  ["SmartGridIndonesia", "67 postingan"],
];

const people = [
  ["Budi Prasetyo Utomo", "Alumni · Founder @ VoltaGrid", "BP", true],
  ["Ahmad Zulkifli", "Mahasiswa Elektro", "AZ", false],
  ["Yoga Pratama", "Mahasiswa Elektro", "YP", false],
];
0
const feedPosts = [
  { initials: "RF", author: "Rizky Firmansyah", handle: "@rizky_f", role: "Mahasiswa Elektro · 2022", time: "2 jam lalu", category: "Beasiswa", title: "Beasiswa LPDP Reguler 2026 Dibuka!", body: "Hei semua! LPDP batch 1 tahun 2026 sudah dibuka pendaftarannya. Deadline 31 Oktober 2026. Dibuka untuk S2/S3 dalam dan luar negeri. Pastikan nilai TOEFL/IELTS kalian sudah siap ya! Kalau ada yang mau diskusi soal persiapan dokumen bisa DM gua.", likes: 142, comments: 38, shares: 22 },
  { initials: "NA", author: "Nadya Aulia Putri", handle: "@nadya.aulia", role: "Mahasiswa Elektro · 2023", time: "4 jam lalu", category: "Magang", title: "Lowongan Magang PLN Persero - Divisi Transmisi", body: "PLN lagi buka rekrutmen magang mahasiswa untuk divisi Transmisi dan Distribusi. Periode Desember 2026-Februari 2027. Syarat: mahasiswa aktif min. semester 5, IPK ≥ 3.0. Benefit: uang saku, sertifikat, kesempatan absorb. Link pendaftaran ada di bio gua!", likes: 90, comments: 21, shares: 45, liked: true },
  { initials: "HE", author: "Himpunan Elektro · HIMATEL", handle: "@himatel_oficial", role: "Pengurus Himpunan", time: "6 jam lalu", category: "Organisasi", title: "Open Recruitment Divisi Litbang HIMATEL 2026", body: "HIMATEL membuka rekrutmen anggota baru untuk Divisi Litbang (Penelitian & Pengembangan). Kami mencari mahasiswa yang passion di bidang riset dan inovasi teknologi. Pendaftaran: 20-30 September 2026. Tahapan: berkas → wawancara → magang → pelantikan.", likes: 203, comments: 67, shares: 89 },
  { initials: "AB", author: "Arif Budi Santoso", handle: "@arifbudi_21", role: "Mahasiswa Elektro · 2021", time: "1 hari lalu", category: "Akademik", title: "Tips Lulus Mata Kuliah Sistem Tenaga Listrik", body: "Buat temen-temen yang lagi ngambil Sistem Tenaga Listrik semester ini, gua mau share beberapa tips berdasarkan pengalaman. Yang penting banget: kuasai load flow analysis (Newton-Raphson), pahami per-unit system, dan rajin latihan soal fault analysis.", likes: 176, comments: 54, shares: 31 },
  { initials: "SR", author: "Siti Rahmawati", handle: "@siti.rahmawati_", role: "Mahasiswa Elektro · 2022", time: "1 hari lalu", category: "Beasiswa", title: "Beasiswa BCA Finance untuk Mahasiswa Teknik", body: "BCA Finance memberikan beasiswa senilai Rp 10 juta/semester untuk mahasiswa teknik berprestasi. Syarat: IPK min 3.5, aktif berorganisasi, dan tidak sedang menerima beasiswa lain. Gua udah apply dan lagi proses wawancara.", likes: 95, comments: 29, shares: 18, liked: true },
  { initials: "MF", author: "Muhammad Fauzan", handle: "@fauzan_me", role: "Mahasiswa Elektro · 2023", time: "2 hari lalu", category: "Info Kampus", title: "Perubahan Jadwal UTS Gasal 2026", body: "Infonya dari bagian akademik: jadwal UTS Gasal 2026 mengalami pergeseran. Elektro Dasar I yang tadinya 14 Oktober sekarang jadi 17 Oktober. Kalkulus III juga berubah dari 16 ke 19 Oktober. Cek portal akademik kalian ya buat update terbaru!", likes: 312, comments: 89, shares: 156 },
];

const tensiPosts = [
  { initials: "TN", author: "TENSI - Tim Himpunan", handle: "@tensi_himatel", role: "Redaksi TENSI", time: "3 jam lalu", category: "TENSI", title: "Edisi September: Inovasi Energi Terbarukan di Kampus", body: "TENSI hadir lagi dengan edisi September 2026! Kali ini kami membahas implementasi panel surya di gedung baru Fakultas Teknik, wawancara eksklusif dengan Prof. Dr. Bambang Susilo tentang transisi energi Indonesia, serta recap kegiatan lomba robot nasional KRPAI 2026 yang diikuti tim kita.", likes: 287, comments: 45, shares: 78 },
  { initials: "TN", author: "TENSI - Tim Himpunan", handle: "@tensi_himatel", role: "Redaksi TENSI", time: "1 minggu lalu", category: "TENSI", title: "Liputan: Dies Natalis Fakultas Teknik ke-45", body: "Fakultas Teknik merayakan Dies Natalis ke-45 dengan berbagai rangkaian kegiatan. Dari seminar nasional bertema Smart City untuk Indonesia Maju, pameran karya inovasi mahasiswa, hingga malam penghargaan alumni berprestasi. TENSI meliput semua momen pentingnya untuk kalian.", likes: 422, comments: 67, shares: 103, liked: true },
  { initials: "TN", author: "TENSI - Tim Himpunan", handle: "@tensi_himatel", role: "Redaksi TENSI", time: "2 minggu lalu", category: "TENSI", title: "Profil Dosen: Mengenal Pak Hendra, Pakar Elektronika Daya", body: "Di edisi kali ini TENSI mempersembahkan profil lengkap Dr. Hendra Kusuma, S.T., M.T. - dosen yang dikenal dengan gaya mengajar interaktif dan riset Power Electronics-nya yang produktif. Beliau berbagi cerita perjalanan akademik, tips untuk mahasiswa, dan visi beliau untuk jurusan kita.", likes: 198, comments: 34, shares: 56 },
];

const alumniPosts = [
  { initials: "IS", author: "Irwan Setiawan", handle: "@irwan_engineer", role: "Alumni 2015 · Senior Engineer @ PLN", time: "5 jam lalu", category: "Alumni", title: "Pengalaman 10 Tahun di PLN: Apa yang Gua Pelajari", body: "Halo adek-adek! Gua Irwan, alumni angkatan 2015. Sekarang gua kerja sebagai Senior Transmission Engineer di PLN Pusat Jakarta. Mau sharing sedikit soal perjalanan 10 tahun gua. Yang paling berharga itu bukan nilai IPK-nya, tapi kemampuan problem solving dan soft skill komunikasi.", likes: 534, comments: 112, shares: 89 },
  { initials: "DK", author: "Dewi Kartika Sari", handle: "@dewi.kartika", role: "Alumni 2018 · Product Engineer @ Tokopedia", time: "1 hari lalu", category: "Alumni", title: "Dari Elektro ke Tech Company: Gak Semudah itu, Tapi Bisa!", body: "Banyak yang tanya gimana gua bisa masuk Tokopedia sebagai Hardware Product Engineer. Jujur perjalanannya panjang: magang di 3 tempat berbeda, aktif di komunitas maker, ikut bootcamp IoT. Tapi kuncinya: jangan batasi diri hanya di jalur aman karir Elektro konvensional.", likes: 390, comments: 78, shares: 134, liked: true },
  { initials: "BP", author: "Budi Prasetyo Utomo", handle: "@budi.prasetyo", role: "Alumni 2012 · Founder @ VoltaGrid", time: "3 hari lalu", category: "Alumni", title: "Startup Energi: Peluang Besar untuk Lulusan Elektro", body: "Setelah 8 tahun di korporat, gua akhirnya bikin startup energi sendiri - VoltaGrid, platform manajemen energi untuk industri manufaktur. Saat ini sudah onboarding 15 klien di Jawa-Bali. Kita lagi buka internship dan fresh grad position. Kalau kalian passionate di renewable energy + software, ini kesempatan kalian!", likes: 612, comments: 145, shares: 203 },
];

const navItems = [
  ["beranda", "Beranda", House], ["tensi", "TENSI", Newspaper], ["alumni", "Alumni", GraduationCap], ["network", "Network", UsersRound], ["profil", "Profil", UserRound],
];

const categoryStyle = {
  Beasiswa: "bg-emerald-50 text-emerald-700", Magang: "bg-blue-50 text-blue-700", Organisasi: "bg-fuchsia-50 text-fuchsia-700", Akademik: "bg-red-50 text-red-700", "Info Kampus": "bg-amber-50 text-amber-700", TENSI: "bg-[#fbf5ea] text-[#b77b21]", Alumni: "bg-blue-50 text-[#476da5]",
};

function Avatar({ initials, goldAvatar = false, large = false }) {
  return <div className={`${large ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm"} shrink-0 rounded-full grid place-items-center font-bold text-white ${goldAvatar ? "bg-[#d5a344]" : "bg-[#474747]"}`}>{initials}</div>;
}

function Sidebar({ active }) {
  return <aside className="bg-[#1d1d1b] text-white lg:sticky lg:top-0 lg:h-screen lg:w-[236px] lg:shrink-0">
    <div className="flex h-full flex-col px-4 py-5 lg:px-5 lg:py-7">
      <Link to="/ime-connect" className="flex items-center gap-3 px-1">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#cb9638]"><Zap size={20} fill="currentColor" /></span>
        <span><b className="block font-serif text-[20px] leading-5">IME Connect</b><small className="text-xs text-white/40">Himpunan Elektro</small></span>
      </Link>
      <nav className="mt-8 flex gap-1 overflow-x-auto pb-1 lg:mt-12 lg:block lg:space-y-2 lg:overflow-visible">
        {navItems.map(([key, label, Icon]) => <Link key={key} to={key === "beranda" ? "/ime-connect" : `/ime-connect/${key}`} className={`flex min-w-fit items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold transition ${active === key ? "bg-[#382f1c] text-[#d5a344]" : "text-white/75 hover:bg-white/5 hover:text-white"}`}>
          {key === "tensi" && active !== key ? <Folder size={21} /> : <Icon size={21} />}<span>{label}</span>{key === "tensi" && <em className="ml-auto rounded-full bg-[#d5a344] px-2 py-0.5 text-[11px] not-italic text-white">Baru</em>}
        </Link>)}
      </nav>
      <div className="mt-auto hidden rounded-xl border border-white/10 bg-white/[0.035] p-3 lg:flex lg:items-center lg:gap-3">
        <Avatar initials="AK" goldAvatar /><span className="min-w-0"><b className="block truncate text-sm">Andi Kurniawan</b><small className="block truncate text-xs text-white/35">@andi.kurniawan</small></span>
      </div>
    </div>
  </aside>;
}

function RightRail() {
  const [following, setFollowing] = useState({});
  return <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
    <label className="relative block"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400" size={19} /><input aria-label="Cari informasi" placeholder="Cari informasi..." className="h-14 w-full rounded-2xl border-0 bg-[#efeee9] pl-12 pr-5 text-sm outline-none placeholder:text-stone-400 focus:ring-2 focus:ring-[#d5a344]/40" /></label>
    <section className="rounded-[20px] border border-stone-200 bg-white p-5"><h2 className="font-serif text-xl font-bold">Trending di Elektro</h2><div className="mt-5 space-y-4">{trending.map(([tag, count], index) => <div key={tag}><p className="text-sm text-stone-500">#{index + 1} Elektro</p><b className="block text-[16px] leading-5">#{tag}</b><p className="text-sm text-stone-500">{count}</p></div>)}</div></section>
    <section className="rounded-[20px] border border-stone-200 bg-white p-5"><div className="flex items-center justify-between gap-2"><h2 className="font-serif text-xl font-bold">Mungkin Kamu Kenal</h2><button className="text-xs font-bold text-[#bf8730]">Lihat semua</button></div><div className="mt-4 space-y-3">{people.map(([name, role, initials]) => <div className="flex items-center gap-2" key={name}><Avatar initials={initials} goldAvatar={initials === "BP"} /><div className="min-w-0 flex-1"><b className="block truncate text-sm">{name}</b><p className="truncate text-xs text-stone-500">{role}</p></div><button onClick={() => setFollowing((state) => ({ ...state, [name]: !state[name] }))} className={`rounded-full px-3 py-1.5 text-xs font-bold ${following[name] ? "bg-stone-100 text-stone-500" : "bg-[#c99235] text-white"}`}>{following[name] ? "Following" : "Follow"}</button></div>)}</div></section>
    <p className="text-center text-xs text-stone-500">© 2026 IME Connect · Himpunan Elektro</p>
  </aside>;
}

function PostCard({ post }) {
  const [liked, setLiked] = useState(Boolean(post.liked));
  const [saved, setSaved] = useState(false);
  return <article className="rounded-[16px] border border-stone-200 bg-white p-5 sm:p-6"><div className="flex items-start gap-3"><Avatar initials={post.initials} goldAvatar={post.initials === "TN" || post.initials === "HE"} large /><div className="min-w-0"><div className="flex flex-wrap items-baseline gap-x-2"><b className="text-[15px] text-slate-800">{post.author}</b><span className="text-sm text-stone-500">{post.handle} · {post.time}</span></div><p className="text-sm text-stone-500">{post.role}</p></div></div><div className="ml-[68px] mt-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${categoryStyle[post.category]}`}>{post.category}</span><h2 className="mt-3 font-serif text-[21px] font-bold leading-tight text-slate-800 sm:text-[22px]">{post.title}</h2><p className="mt-2 text-[15px] leading-6 text-stone-600">{post.body}</p><div className="mt-4 flex items-center border-t border-stone-200 pt-3 text-sm text-stone-500"><button onClick={() => setLiked(!liked)} className={`flex items-center gap-1.5 ${liked ? "text-red-500" : "hover:text-red-500"}`}><Heart size={18} fill={liked ? "currentColor" : "none"} />{post.likes + (liked && !post.liked ? 1 : !liked && post.liked ? -1 : 0)}</button><button className="ml-5 flex items-center gap-1.5 hover:text-stone-800"><MessageCircle size={17} />{post.comments}</button><button className="ml-5 flex items-center gap-1.5 hover:text-stone-800"><Share2 size={17} />{post.shares}</button><button onClick={() => setSaved(!saved)} className={`ml-auto flex items-center gap-1.5 ${saved ? "text-[#c99235]" : "hover:text-[#c99235]"}`}><Bookmark size={17} fill={saved ? "currentColor" : "none"} /><span className="hidden sm:inline">Simpan</span></button></div></div></article>;
}

function ComposerAndFeed({ posts, isHome = false }) {
  const [filter, setFilter] = useState("Semua");
  const filters = ["Semua", "Beasiswa", "Magang", "Organisasi", "Akademik", "Info Kampus"];
  const filtered = useMemo(() => filter === "Semua" ? posts : posts.filter((post) => post.category === filter), [filter, posts]);
  return <div className="space-y-4">{isHome && <><div className="rounded-[16px] border border-stone-200 bg-white p-4"><div className="flex items-center gap-3"><Avatar initials="AK" goldAvatar /><button className="h-10 flex-1 rounded-full bg-[#efeeeb] px-5 text-left text-sm text-stone-500">Bagikan informasi untuk teman Elektro...</button></div></div><div className="flex gap-2 overflow-x-auto pb-1">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${filter === item ? "bg-[#c99235] text-white" : "bg-[#efeeeb] text-stone-500 hover:bg-stone-200"}`}>{item}</button>)}</div></>}<div className="space-y-4">{filtered.map((post) => <PostCard key={post.title} post={post} />)}</div></div>;
}

function IntroCard({ type }) {
  const isTensi = type === "tensi";
  return <section className={`rounded-[20px] p-7 text-white sm:p-8 ${isTensi ? "bg-gradient-to-br from-[#20201e] to-[#302b22]" : "bg-gradient-to-br from-[#1b345a] to-[#29496f]"}`}><div className="flex items-center gap-4"><span className={`grid h-12 w-12 place-items-center rounded-2xl ${isTensi ? "bg-[#c99235]" : "bg-[#45679d]"}`}>{isTensi ? <Newspaper /> : <GraduationCap />}</span><div><h1 className="font-serif text-3xl font-bold">{isTensi ? "TENSI" : "Pojok Alumni"}</h1><p className="text-sm text-white/55">{isTensi ? "Teknologi & Informasi Himpunan Elektro" : "Cerita & Informasi dari Para Senior"}</p></div></div><p className="mt-5 max-w-2xl text-[16px] leading-6 text-white/65">{isTensi ? "Kanal resmi berita, liputan, dan konten editorial dari Himpunan Mahasiswa Teknik Elektro. Ditulis dan dikurasi langsung oleh tim redaksi TENSI." : "Ruang berbagi untuk alumni Teknik Elektro - pengalaman kerja, peluang karir, tips industri, dan jejaring profesional."}</p><div className="mt-6 flex gap-7 border-t border-white/10 pt-5">{(isTensi ? [["48", "Edisi"], ["12.4K", "Pembaca"], ["Sep '26", "Edisi Terbaru"]] : [["2.1K", "Alumni"], ["47", "Perusahaan"], ["12", "Angkatan"]]).map(([count, label]) => <div key={label}><b className="block text-2xl">{count}</b><span className="text-sm text-white/50">{label}</span></div>)}</div></section>;
}

function Network() {
  const [tab, setTab] = useState("Temukan");
  const [following, setFollowing] = useState({ Citra: true, Putri: true, Dimas: true });
  const members = [["Budi Prasetyo Utomo", "Alumni · Founder @ VoltaGrid", "12 mutual · Angkatan 2012", "BP"], ["Citra Lestari", "Mahasiswa Elektro", "8 mutual · Angkatan 2022", "CL"], ["Ahmad Zulkifli", "Mahasiswa Elektro", "15 mutual · Angkatan 2021", "AZ"], ["Putri Anggraini", "Alumni · Engineer @ Pertamina", "5 mutual · Angkatan 2016", "PA"], ["Yoga Pratama", "Mahasiswa Elektro", "3 mutual · Angkatan 2023", "YP"], ["Rina Marlina", "Alumni · Researcher @ BRIN", "7 mutual · Angkatan 2014", "RM"], ["Dimas Wahyu", "Mahasiswa Elektro", "19 mutual · Angkatan 2022", "DW"], ["Nisa Febrianti", "Mahasiswa Elektro", "2 mutual · Angkatan 2023", "NF"]];
  return <><div className="flex rounded-[18px] bg-[#edebe7] p-1">{["Temukan", "Following", "Followers"].map((item) => <button key={item} onClick={() => setTab(item)} className={`h-12 flex-1 rounded-2xl text-sm font-bold ${tab === item ? "bg-white shadow-sm" : "text-stone-500"}`}>{item}</button>)}</div><div className="mt-6 space-y-4">{members.map(([name, role, meta, initials]) => { const isFollowing = Boolean(following[name.split(" ")[0]]); return <article className="flex items-center gap-4 rounded-[18px] border border-stone-200 bg-white p-5" key={name}><Avatar initials={initials} goldAvatar={initials === "BP" || initials === "PA" || initials === "RM"} large /><div className="min-w-0 flex-1"><h2 className="font-bold text-slate-800">{name}</h2><p className="truncate text-sm text-stone-500">{role}</p><p className="text-sm text-stone-500">{meta}</p></div><button onClick={() => setFollowing((state) => ({ ...state, [name.split(" ")[0]]: !isFollowing }))} className={`rounded-full px-5 py-2 text-sm font-bold ${isFollowing ? "bg-[#f0efeb] text-stone-500" : "bg-[#c99235] text-white"}`}>{isFollowing ? "Following" : "Follow"}</button></article> })}</div></>;
}

function Profile() {
  const [tab, setTab] = useState("Postingan");
  return <><section className="overflow-hidden rounded-[20px] border border-stone-200 bg-white"><div className="h-40 bg-[linear-gradient(120deg,#211f1d_0%,#2b2520_48%,#c99235_100%)]" /><div className="relative px-6 pb-6"><div className="-mt-14 flex items-end justify-between"><div className="grid h-24 w-24 place-items-center rounded-[22px] border-[5px] border-white bg-[#d5a344] text-2xl font-bold text-white">AK</div><button className="rounded-full border border-stone-200 px-5 py-2 text-sm font-bold">Edit Profil</button></div><h1 className="mt-5 font-serif text-3xl font-bold">Andi Kurniawan</h1><p className="text-stone-500">@andi.kurniawan · Mahasiswa Teknik Elektro · 2022</p><p className="mt-4 text-[15px] leading-6 text-stone-700">Passionate about power systems & renewable energy. Anggota HIMATEL, tim riset Smart Grid. <span className="text-[#c99235]">⚡</span></p><div className="mt-5 flex gap-6 text-sm text-stone-500"><span><b className="text-lg text-stone-800">48</b> Following</span><span><b className="text-lg text-stone-800">134</b> Followers</span><span><b className="text-lg text-stone-800">12</b> Postingan</span></div><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">LPDP Awardee 2026</span><span className="rounded-full bg-amber-50 px-3 py-1 text-sm text-[#bd8530]">HIMATEL Litbang</span><span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">Magang PLN</span></div></div></section><div className="mt-5 flex rounded-[18px] bg-[#edebe7] p-1">{["Postingan", "Disimpan", "Tentang"].map((item) => <button key={item} onClick={() => setTab(item)} className={`h-11 flex-1 rounded-2xl text-sm font-bold ${tab === item ? "bg-white shadow-sm" : "text-stone-500"}`}>{item}</button>)}</div><div className="mt-6">{tab === "Postingan" ? <ComposerAndFeed posts={feedPosts.slice(0, 2)} /> : <div className="rounded-[18px] border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">{tab === "Disimpan" ? "Belum ada postingan yang disimpan." : "Mahasiswa Teknik Elektro angkatan 2022."}</div>}</div></>;
}

export default function ImeConnectPage() {
  const { pathname } = useLocation();
  const active = pathname.split("/")[2] || "beranda";
  const info = { beranda: ["Beranda", ""], tensi: ["TENSI", ""], alumni: ["Pojok Alumni", ""], network: ["Network", ""], profil: ["Profil Saya", ""] }[active] || ["Beranda", ""];
  return <div className="min-h-screen bg-[#f6f5f1] text-[#252525]"><div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row"><Sidebar active={active} /><div className="min-w-0 flex-1 px-4 py-7 sm:px-7 lg:px-9"><div className="mx-auto grid max-w-[1140px] gap-7 xl:grid-cols-[minmax(0,1fr)_280px]"><section className="min-w-0"><header className="mb-6"><h1 className="font-serif text-4xl font-bold leading-none sm:text-[42px]">{info[0]}</h1><span className="mt-3 block h-[3px] w-11 rounded-full bg-[#c99235]" /></header>{active === "beranda" && <ComposerAndFeed posts={feedPosts} isHome />}{active === "tensi" && <div className="space-y-6"><IntroCard type="tensi" /><ComposerAndFeed posts={tensiPosts} /></div>}{active === "alumni" && <div className="space-y-6"><IntroCard type="alumni" /><ComposerAndFeed posts={alumniPosts} /></div>}{active === "network" && <Network />}{active === "profil" && <Profile />}</section><div className="hidden xl:block"><RightRail /></div></div></div></div></div>;
}
