"use client";

import { useEffect, useRef } from "react";

// Particles (reactbits.dev pattern) — lightweight canvas particle field with
// gentle cursor attraction. Pauses when off-screen; respects reduced motion.

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
};

export function Particles({
  className = "",
  density = 0.00008,
  color = "#86efac",
  interactive = true,
}: {
  className?: string;
  density?: number;
  color?: string;
  interactive?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];
    let raf = 0;
    let running = true;
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx?.scale(window.devicePixelRatio, window.devicePixelRatio);
      const count = Math.min(120, Math.floor(rect.width * rect.height * density));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        size: Math.random() * 2 + 0.6,
      }));
    }

    function step() {
      if (!running || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      ctx?.clearRect(0, 0, rect.width, rect.height);

      for (const p of particles) {
        if (interactive) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 120 && dist > 0.01) {
            p.vx += (dx / dist) * 0.012;
            p.vy += (dy / dist) * 0.012;
          }
        }
        p.vx = Math.max(-0.5, Math.min(0.5, p.vx));
        p.vy = Math.max(-0.5, Math.min(0.5, p.vy));
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = rect.width + 10;
        if (p.x > rect.width + 10) p.x = -10;
        if (p.y < -10) p.y = rect.height + 10;
        if (p.y > rect.height + 10) p.y = -10;

        ctx?.beginPath();
        ctx?.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = color;
        ctx!.globalAlpha = 0.55;
        ctx?.fill();
      }

      // Constellation lines between close particles.
      ctx!.globalAlpha = 1;
      ctx!.strokeStyle = color;
      ctx!.lineWidth = 0.4;
      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const a = particles[i];
          const b = particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 90) {
            ctx!.globalAlpha = 0.12 * (1 - dist / 90);
            ctx?.beginPath();
            ctx?.moveTo(a.x, a.y);
            ctx?.lineTo(b.x, b.y);
            ctx?.stroke();
          }
        }
      }
      raf = requestAnimationFrame(step);
    }

    const observer = new IntersectionObserver(([entry]) => {
      running = entry.isIntersecting;
      if (running) raf = requestAnimationFrame(step);
      else cancelAnimationFrame(raf);
    });
    observer.observe(canvas);

    function onMouse(event: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
    }

    resize();
    window.addEventListener("resize", resize);
    if (interactive) window.addEventListener("mousemove", onMouse);
    raf = requestAnimationFrame(step);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, [density, color, interactive]);

  return <canvas ref={canvasRef} className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} aria-hidden />;
}
