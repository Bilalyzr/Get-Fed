"use client";

import { useEffect } from "react";
import Lenis from "lenis";

// ---------------------------------------------------------------------------
// SmoothScroll — Lenis-powered inertial wheel scrolling for the whole app.
//
// - Disabled entirely under prefers-reduced-motion (native scroll remains).
// - Touch devices keep their native scroll (smoothWheel only).
// - rAF loop pauses when the tab is hidden; everything torn down on unmount.
// ---------------------------------------------------------------------------

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduced || coarse) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
    });

    let raf = 0;
    let running = true;
    const loop = (time: number) => {
      lenis.raf(time);
      if (running) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
