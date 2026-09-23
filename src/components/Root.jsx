import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import Lenis from "lenis";
import Navbar from "./Navbar";
import Footer from "./Footer";
import SiteProvider from "./SiteProvider";

export default function Root() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");
  const isImeConnect = location.pathname.startsWith("/ime-connect");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    let frame = 0;
    const loop = (time) => {
      lenis.raf(time);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const shell = (
    <div className="min-h-screen flex flex-col">
      {!isImeConnect && <Navbar />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!isDashboard && !isImeConnect && <Footer />}
    </div>
  );

  return isImeConnect ? shell : <SiteProvider>{shell}</SiteProvider>;
}
