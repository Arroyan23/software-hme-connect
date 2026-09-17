import { useState } from "react";
import { Link, useLocation } from "react-router";
import { ArrowUpRight, Menu, X } from "lucide-react";
import hmeLogo from "../img/Patokan Design HME_Aisyah & Althaf .png";

const navLinks = [
  { label: "Beranda", href: "/" },
  { label: "TENSI", href: "/tensi" },
  { label: "Kegiatan", href: "/kegiatan" },
  { label: "Alumni", href: "/alumni" },
  { label: "Dashboard", href: "/dashboard" },
];

export default function Navbar() {
  const [menuPath, setMenuPath] = useState(null);
  const { pathname } = useLocation();
  const open = menuPath === pathname;
  const active = (href) => pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <nav aria-label="Navigasi utama" onKeyDown={e => { if (e.key === "Escape") setMenuPath(null); }} className="fixed inset-x-0 top-0 z-50 border-b border-[#e4be62]/15 bg-[#0d1010]/90 text-white shadow-[0_8px_30px_#00000018] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" onClick={() => setMenuPath(null)} aria-label="HME UA, Beranda" className="group flex shrink-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e4be62]">
          <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-white p-1 shadow transition group-hover:shadow-md"><img src={hmeLogo} alt="Logo HME UA" className="size-full object-contain" /></span>
          <span className="grid gap-1"><span className="text-sm font-bold leading-none">HME <span className="text-[#e4be62]">UA</span></span><span className="text-[10px] leading-none text-white/50">Universitas Airlangga</span></span>
        </Link>

        <div className="hidden h-full items-center gap-1 md:flex lg:gap-3">
          {navLinks.map(link => (
            <Link key={link.href} to={link.href} aria-current={active(link.href) ? "page" : undefined} className={`group relative inline-flex h-full items-center gap-2 px-4 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#e4be62] ${active(link.href) ? "text-[#e4be62]" : "text-white/65 hover:text-white"}`}>
              {link.label}
              {link.href === "/dashboard" && <ArrowUpRight size={14} aria-hidden="true" className="opacity-50" />}
              <span aria-hidden="true" className={`absolute inset-x-4 bottom-0 h-0.5 origin-center bg-[#e4be62] transition-transform duration-300 motion-reduce:transition-none ${active(link.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
            </Link>
          ))}
        </div>

        <button type="button" aria-label={open ? "Tutup menu" : "Buka menu"} title={open ? "Tutup menu" : "Buka menu"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setMenuPath(open ? null : pathname)} className="grid size-10 place-items-center rounded-lg border border-white/10 text-[#e4be62] transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#e4be62] md:hidden">
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {open && (
        <div id="mobile-navigation" className="max-h-[calc(100dvh-64px)] overflow-y-auto border-t border-white/10 bg-[#0d1010] px-4 py-3 md:hidden">
          {navLinks.map(link => (
            <Link key={link.href} to={link.href} onClick={() => setMenuPath(null)} aria-current={active(link.href) ? "page" : undefined} className={`flex min-h-12 items-center justify-between rounded-lg px-4 text-sm font-medium transition-colors ${active(link.href) ? "bg-[#e4be62]/10 text-[#e4be62]" : "text-white/70 hover:bg-white/5 hover:text-white"}`}>
              {link.label}<ArrowUpRight size={16} aria-hidden="true" className="opacity-50" />
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
