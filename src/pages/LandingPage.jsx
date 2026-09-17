import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import heroImage from "../img/Gambar 1.JPG";
import medinfoBg from "../img/gambarmedinfo.JPG";
import { useSite } from "../lib/site-context";
import DetailModal from "../components/DetailModal";
import { ChevronLeft, ChevronRight } from "lucide-react";

const revealClasses = "opacity-0 translate-y-8 transition-[opacity,transform] duration-700 ease-out";
const containerClasses = "mx-auto w-[calc(100%-36px)] max-w-[1150px]";

function Hero() {
  const { settings } = useSite();
  const text = "transition-[opacity,transform] duration-1000 ease-out";

  return (
    <section className="sticky top-0 z-10 grid min-h-[100svh] place-items-center overflow-hidden text-center">
      <img data-parallax className="absolute inset-0 size-full scale-[1.16] object-cover" src={heroImage} alt="" aria-hidden="true" />
      <div className="absolute inset-0 bg-black/65" />
      <div className={`${containerClasses} relative z-10 pb-[72px] pt-[104px]`}>
        <span data-hero-animate className={`${text} inline-block rounded-full border border-[#d19b3a]/25 bg-[#c18b2d]/[.12] px-[13px] py-[7px] font-mono text-[10px] font-semibold uppercase tracking-[.14em] text-[#d19b3a] opacity-0 translate-y-7`}>KEPENGURUSAN {settings.periode}</span>
        <h1 data-hero-animate className={`${text} mt-[30px] text-[40px] font-bold leading-[1.08] tracking-normal text-white opacity-0 translate-y-7 min-[701px]:text-[56px] min-[901px]:text-[76px]`}>
          Himpunan Mahasiswa<span className="block font-extrabold text-[#c99230]">Elektro</span>
        </h1>
        <p data-hero-animate className={`${text} mx-auto mb-7 mt-[15px] max-w-[680px] text-[14px] leading-[1.7] text-white/[.82] opacity-0 translate-y-7 min-[701px]:text-base`}>Universitas Airlangga — Fakultas Teknologi Maju dan Multidisiplin.<br className="hidden sm:block" /> Bersama bertumbuh, berinovasi, dan memberikan dampak nyata.</p>
        <Link data-hero-animate to="/kegiatan" className={`${text} inline-flex min-h-12 translate-y-7 items-center justify-center rounded-[7px] bg-[#bd8b36] px-5 text-sm font-bold text-[#101a16] opacity-0 hover:-translate-y-0.5 hover:bg-[#d5a548] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#e7be69]`}>Lihat Kegiatan</Link>
      </div>
      <span className="absolute bottom-8 left-1/2 h-12 w-px origin-top -translate-x-1/2 animate-pulse bg-[#e7be69]" aria-hidden="true" />
    </section>
  );
}

function DosenSection() {
  const { dosenItems } = useSite();

  return (
    <section className="relative z-20 -mt-6 grid min-h-[100svh] place-items-center overflow-hidden rounded-t-[24px] text-center shadow-[0_-20px_60px_rgba(0,0,0,.45)]">
      <img data-parallax className="absolute inset-0 size-full scale-[1.16] object-cover" src={heroImage} alt="" aria-hidden="true" />
      <div className="absolute inset-0 bg-black/[.78]" />
      <div className={`${containerClasses} relative z-10 py-24 min-[701px]:py-[96px]`}>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[.14em] text-[#d19b3a]">TENAGA PENGAJAR</p>
        <h2 className="mt-[5px] text-[1.7rem] font-medium leading-tight text-white min-[701px]:text-[2.45rem]">Dosen Teknik Elektro</h2>
        <p className="text-[11px] text-white/[.72]">Fakultas Teknologi Maju dan Multidisiplin — Universitas Airlangga</p>
        <div className="mx-auto my-[30px] grid max-w-[920px] grid-cols-4 gap-x-2 gap-y-[22px] min-[701px]:my-11 min-[701px]:gap-x-6 min-[701px]:gap-y-9">
          {dosenItems.map((dosen) => (
            <div data-reveal key={dosen.id} className={`${revealClasses} w-full text-[10px] leading-[1.4] text-white/[.78] min-[701px]:text-[11px]`}>
              <img src={dosen.photo} alt={dosen.name} className="mx-auto mb-2 size-14 rounded-full border-2 border-white/[.75] object-cover transition duration-500 ease-out hover:-translate-y-2 hover:scale-105 hover:border-[#e7be69] min-[701px]:mb-3 min-[701px]:size-24" />
              <span>{dosen.name}</span>
            </div>
          ))}
        </div>
        <p className="font-mono text-[9px] text-white/[.42]">+32 dosen lainnya · Teknik Elektro FTMM UNAIR</p>
      </div>
    </section>
  );
}

function KegiatanSection() {
  const [selected, setSelected] = useState(null);
  const { kegiatanItems } = useSite();
  if (!kegiatanItems.length) return null;

  return (
    <section className="sticky top-0 z-10 grid min-h-[100svh] items-center bg-[#181b1a] py-24 text-white">
      {selected && <DetailModal item={selected} onClose={() => setSelected(null)} />}
      <div className={containerClasses}>
        <div data-reveal className={`${revealClasses} mb-[22px] flex items-end justify-between`}>
          <div><p className="font-mono text-[10px] font-semibold uppercase tracking-[.14em] text-[#d19b3a]">AGENDA HIMPUNAN</p><h2 className="mt-[5px] text-[30px] font-bold tracking-normal text-[#c99230] min-[701px]:text-[40px]">Kegiatan Terbaru</h2></div>
          <Link to="/kegiatan" className="text-[11px] text-white/[.78] hover:text-white">Lihat semua <span aria-hidden="true" className="pl-1 text-xl align-[-1px]">›</span></Link>
        </div>
        <div className="grid gap-[22px] min-[701px]:grid-cols-[minmax(0,1.05fr)_minmax(330px,.95fr)] min-[701px]:gap-10">
          <button data-reveal type="button" className={`${revealClasses} group relative min-h-[370px] overflow-hidden rounded-lg border-0 bg-[#101010] p-0 text-left text-white min-[701px]:min-h-[410px]`} onClick={() => setSelected(kegiatanItems[0])}>
            <img className="absolute inset-0 size-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.07]" src={kegiatanItems[0].image} alt={kegiatanItems[0].title} />
            <span className="absolute inset-0 bg-gradient-to-t from-[#050a14]/[.95] to-[#050a14]/[.05]" />
            <span className="absolute inset-x-7 bottom-7 grid gap-3"><small className="text-[11px] text-[#d29a34]">{kegiatanItems[0].date}</small><strong className="max-w-[490px] text-[23px] font-medium leading-[1.15] min-[701px]:text-[26px]">{kegiatanItems[0].title}</strong><span className="max-w-[490px] text-[12px] leading-[1.45] text-white/[.72] min-[701px]:text-sm">{kegiatanItems[0].desc}</span></span>
          </button>
          <div className="grid content-center gap-0">
            {kegiatanItems.slice(1, 4).map((item) => (
              <button data-reveal type="button" key={item.id} className={`${revealClasses} group grid w-full grid-cols-[70px_minmax(0,1fr)] gap-3 border-b border-white/[.12] bg-transparent py-[18px] text-left text-white min-[701px]:grid-cols-[86px_minmax(0,1fr)] min-[701px]:gap-5`} onClick={() => setSelected(item)}>
                <img className="size-[70px] rounded-[7px] object-cover transition duration-500 group-hover:-rotate-3 group-hover:scale-105 min-[701px]:size-[86px]" src={item.image} alt={item.title} />
                <span className="grid content-center gap-[3px]"><small className="text-[10px] text-[#d29a34] min-[701px]:text-[11px]">{item.date}</small><strong className="text-[12px] leading-tight text-[#d19a37] min-[701px]:text-[15px]">{item.title}</strong><em className="line-clamp-2 text-[10px] not-italic leading-[1.3] text-white/[.68] min-[701px]:text-xs">{item.desc}</em></span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function OrgNode({ person }) {
  return (
    <div data-reveal className={`${revealClasses} grid justify-items-center gap-2 text-center`}>
      {person.photo ? (
        <img src={person.photo} alt={person.name} className="size-20 rounded-full border-2 border-[#ba862f] object-cover shadow-md transition duration-500 ease-out hover:-translate-y-2 hover:scale-105 min-[701px]:size-24" />
      ) : (
        <span className="grid size-20 place-items-center rounded-full bg-[#ba862f] text-xl font-bold text-white shadow-md transition duration-500 ease-out hover:-translate-y-2 hover:scale-105 min-[701px]:size-24 min-[701px]:text-2xl">{person.name.split(" ").slice(0, 2).map((part) => part[0]).join("")}</span>
      )}
      <div className="grid gap-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#c18b2d] min-[701px]:text-[11px]">{person.jabatan}</span>
        <b className="text-xs text-[#182c28] min-[701px]:text-sm">{person.name}</b>
        <em className="text-[10px] not-italic text-[#182c28]/55">Angkatan {person.angkatan}</em>
      </div>
    </div>
  );
}

function StrukturSection() {
  const { pengurusItems, settings } = useSite();
  const { petinggi, divisi } = pengurusItems;
  const norm = (s) => (s || "").toLowerCase();
  const ketua = petinggi.find((p) => norm(p.jabatan).includes("ketua") && !norm(p.jabatan).includes("wakil")) ?? petinggi[0];
  const wakil = petinggi.find((p) => p !== ketua && norm(p.jabatan).includes("wakil")) ?? petinggi.find((p) => p !== ketua);
  const leaders = [ketua, wakil].filter(Boolean);
  const rest = petinggi.filter((p) => p !== ketua && p !== wakil);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const touchX = useRef(null);
  const sliderRef = useRef(null);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (paused || !inView || divisi.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % divisi.length), 5000);
    return () => clearInterval(id);
  }, [paused, inView, divisi.length]);

  return (
    <section className="relative z-20 -mt-6 grid min-h-[100svh] items-center overflow-visible rounded-t-[24px] bg-[#e8eeec] pb-0 pt-24 text-[#182c28] shadow-[0_-20px_60px_rgba(0,0,0,.45)]">
      <div className={`${containerClasses} sticky top-16 z-10 grid min-h-[100svh] place-items-center`}>
        <div className="w-full pb-24 pt-16">
          <div data-reveal className={`${revealClasses} mb-[25px] flex justify-center text-center`}><div><p className="font-mono text-[10px] font-semibold uppercase tracking-[.14em] text-[#d19b3a]">KEPENGURUSAN {settings.periode}</p><h2 className="mt-[5px] text-[30px] font-medium tracking-normal text-[#182c28] min-[701px]:text-[2.45rem]">Struktur Himpunan</h2></div></div>
          <p className="my-[22px] text-center font-mono text-xs text-[#c99532]">PIMPINAN HIMPUNAN</p>
          <div className="mx-auto grid max-w-[800px] grid-cols-2 gap-6">
            {leaders.map((person) => <OrgNode key={person.jabatan} person={person} />)}
          </div>
          <div className="mx-auto mt-10 grid max-w-[800px] grid-cols-2 gap-x-4 gap-y-8 min-[701px]:grid-cols-4 min-[701px]:gap-x-6">
            {rest.map((person) => <OrgNode key={person.jabatan} person={person} />)}
          </div>
        </div>
      </div>
      <div className="sticky top-16 z-10 -mt-6 grid min-h-[100svh] place-items-center overflow-hidden rounded-t-[24px] bg-black shadow-[0_-20px_60px_rgba(0,0,0,.25)]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-[#080806]">
          {[
            [12, 18, 15, 12, 11, '#f5cf35'],
            [72, 12, -18, 16, 14, '#d6a51e'],
            [92, 53, -14, -18, 10, '#f4d54a'],
            [58, 82, 20, -12, 16, '#c79719'],
            [15, 85, 16, -20, 13, '#ebbd2b'],
            [38, 32, -15, 18, 9, '#020202'],
            [77, 69, -20, -13, 12, '#030303'],
            [28, 65, 18, 15, 15, '#050505'],
          ].map(([x, y, dx, dy, duration, color], index) => (
            <span key={index} className="absolute size-[min(70vmax,850px)] rounded-full [transform:translate(-50%,-50%)] motion-safe:animate-department-gradient" style={{
              left: `${x}%`, top: `${y}%`,
              background: `radial-gradient(circle, ${color} 0%, ${color}cc 18%, ${color}55 42%, transparent 70%)`,
              '--drift-x': `${dx}vw`, '--drift-y': `${dy}vh`,
              '--drift-duration': `${duration}s`, animationDelay: `${-index * 2.7}s`,
            }} />
          ))}
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/30" />
        <div data-reveal className={`${revealClasses} relative z-10 px-6 py-24 text-center`}>
          <p className="font-mono text-xs tracking-[.2em] text-[#f2d576]">STRUKTUR HIMPUNAN</p>
          <h2 className="mt-4 text-7xl font-extrabold tracking-tight text-white min-[701px]:text-9xl">DEPARTEMEN</h2>
          <p className="mx-auto mt-4 max-w-[520px] text-sm leading-relaxed text-white/75 min-[701px]:text-base">{divisi.length} divisi yang menggerakkan HME UA — bergeser otomatis tiap 5 detik, gunakan panah untuk navigasi.</p>
        </div>
      </div>
      {divisi.length > 0 && (
        <div
          data-reveal
          ref={sliderRef}
          className={`${revealClasses} relative z-20 -mt-6 w-full overflow-hidden shadow-[0_-20px_60px_rgba(0,0,0,.45)]`}
          onPointerEnter={(e) => { if (e.pointerType === "mouse") setPaused(true); }}
          onPointerLeave={() => setPaused(false)}
          onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchX.current == null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 50) setSlide((s) => (dx < 0 ? (s + 1) % divisi.length : (s - 1 + divisi.length) % divisi.length));
          }}
        >
          <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${slide * 100}%)` }}>
            {divisi.map((division, i) => (
              <article key={division.nama} className="relative grid min-h-[100svh] w-full shrink-0 basis-full place-items-center overflow-hidden bg-[#061512] px-6 py-24 text-center text-white">
                <div aria-hidden="true" className={`absolute inset-0 bg-cover bg-center ${inView && i === slide ? "kenburns-active" : ""}`} style={{ backgroundImage: `url(${JSON.stringify(division.photo || medinfoBg)})` }} />
                <span className="absolute inset-0 bg-[#061512]/75" aria-hidden="true" />
                <div className="relative z-10 grid max-w-[800px] justify-items-center gap-4">
                  <span className="grid size-16 place-items-center rounded-2xl bg-[#ba862f] text-xl font-bold text-white min-[701px]:size-20 min-[701px]:text-2xl">{division.nama.split(" ").slice(0, 2).map((part) => part[0]).join("")}</span>
                  <div className="grid gap-2">
                    <strong className="text-4xl font-bold leading-tight min-[701px]:text-6xl">{division.nama}</strong>
                    <span className="text-sm text-white/[.72] min-[701px]:text-lg">{division.kepanjangan}</span>
                  </div>
                  <div className="grid gap-1 border-t border-white/25 pt-4">
                    <small className="text-[11px] uppercase tracking-[.14em] text-white/[.65]">Kepala Divisi</small>
                    <b className="text-base min-[701px]:text-lg">{division.kepala}</b>
                  </div>
                  <mark className="bg-transparent text-xs font-bold whitespace-nowrap text-[#e6c25a] min-[701px]:text-sm">{division.anggota} anggota</mark>
                </div>
              </article>
            ))}
          </div>
          <button type="button" aria-label="Divisi sebelumnya" onClick={() => setSlide((slide - 1 + divisi.length) % divisi.length)} className="absolute left-4 top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur transition hover:bg-white/30 min-[701px]:left-8">
            <ChevronLeft className="size-6" />
          </button>
          <button type="button" aria-label="Divisi berikutnya" onClick={() => setSlide((slide + 1) % divisi.length)} className="absolute right-4 top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur transition hover:bg-white/30 min-[701px]:right-8">
            <ChevronRight className="size-6" />
          </button>
          <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {divisi.map((d, i) => (
              <button key={d.nama} type="button" aria-label={`Ke divisi ${d.nama}`} onClick={() => setSlide(i)} className={`h-2.5 rounded-full transition-all ${i === slide ? "w-8 bg-[#e6c25a]" : "w-2.5 bg-white/40 hover:bg-white/70"}`} />
            ))}
          </div>
          <p className="absolute right-6 top-6 z-10 font-mono text-xs tracking-widest text-white/70">{slide + 1} / {divisi.length}</p>
        </div>
      )}
    </section>
  );
}

function CTABanner() {
  return <section className="relative z-20 grid min-h-[100svh] place-items-center bg-[#18483e] py-24 text-center"><div data-reveal className={`${containerClasses} ${revealClasses}`}><h2 className="text-[30px] font-medium tracking-normal text-white min-[701px]:text-5xl">Bergabunglah dengan HME UA</h2><p className="mx-auto my-6 mb-8 text-sm leading-[1.5] text-white/[.78] min-[701px]:text-base">Jadilah bagian dari komunitas mahasiswa teknik elektro yang aktif, inovatif, dan<br className="hidden sm:block" /> berdampak di Universitas Airlangga.</p><div><Link to="/daftar-anggota" className="m-1 inline-flex min-h-12 items-center justify-center rounded-[7px] bg-white px-5 text-sm font-bold text-[#bb8428] transition hover:-translate-y-0.5 hover:bg-white/[.85]">Daftar Anggota Baru</Link><Link to="/kegiatan" className="m-1 inline-flex min-h-12 items-center justify-center rounded-[7px] border border-white/50 px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/[.12]">Lihat Kegiatan</Link></div></div></section>;
}

export default function LandingPage() {
  const root = useRef(null);
  const { dosenItems, pengurusItems, kegiatanItems } = useSite();

  useEffect(() => {
    const page = root.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let dispose = () => {};
    function setup() {
      dispose();
      const revealTargets = page.querySelectorAll("[data-reveal]");
      if (!preference.matches) {
        const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("opacity-100", "translate-y-0"); observer.unobserve(entry.target); } }), { threshold: 0.12 });
        revealTargets.forEach((target, index) => { target.style.transitionDelay = `${(index % 4) * 75}ms`; observer.observe(target); });
        const photos = page.querySelectorAll("[data-parallax]");
        let frame = 0;
        const update = () => { frame = 0; const viewport = window.innerHeight; photos.forEach((photo) => { const rect = photo.parentElement.getBoundingClientRect(); if (rect.bottom > 0 && rect.top < viewport) { const shift = Math.max(-70, Math.min(70, (viewport / 2 - rect.top - rect.height / 2) * 0.16)); photo.style.transform = `translate3d(0, ${shift}px, 0) scale(1.16)`; } }); const pageRect = page.getBoundingClientRect(); page.style.setProperty("--scroll-progress", Math.max(0, Math.min(1, -pageRect.top / Math.max(1, pageRect.height - viewport)))); };
        const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
        window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", schedule); update();
        dispose = () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); revealTargets.forEach((target) => { target.style.transitionDelay = ""; }); photos.forEach((photo) => { photo.style.transform = ""; }); };
      } else revealTargets.forEach((target) => target.classList.add("opacity-100", "translate-y-0"));
    }
    setup(); preference.addEventListener("change", setup); return () => { dispose(); preference.removeEventListener("change", setup); };
  }, [dosenItems, pengurusItems, kegiatanItems]);

  useEffect(() => { const frame = requestAnimationFrame(() => root.current?.querySelectorAll("[data-hero-animate]").forEach((target, index) => { target.style.transitionDelay = `${index * 150}ms`; target.classList.add("opacity-100", "translate-y-0"); })); return () => cancelAnimationFrame(frame); }, []);

  return <div ref={root} className="relative overflow-clip bg-[#242424] text-white [--scroll-progress:0]"><div className="pointer-events-none fixed left-0 top-16 z-[49] h-[3px] w-full origin-left scale-x-[var(--scroll-progress)] bg-[#e7be69]" aria-hidden="true" /><Hero /><DosenSection /><KegiatanSection /><StrukturSection /><CTABanner /></div>;
}
