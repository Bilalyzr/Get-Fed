"use client";

import { useRef, useState } from "react";

// SpotlightCard (reactbits.dev pattern) — a radial spotlight tracks the
// cursor across the card surface.

export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(22, 163, 74, 0.14)",
}: {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 0, opacity: 0 });

  function onMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
      opacity: 1,
    });
  }

  return (
    <div
      ref={ref}
      className={`fws-spotlight-card relative overflow-hidden ${className}`}
      onMouseMove={onMove}
      onMouseLeave={() => setPos((p) => ({ ...p, opacity: 0 }))}
      style={{
        ["--fws-spot-x" as string]: `${pos.x}%`,
        ["--fws-spot-y" as string]: `${pos.y}%`,
        ["--fws-spot-color" as string]: spotlightColor,
        ["--fws-spot-opacity" as string]: pos.opacity,
      }}
    >
      {children}
    </div>
  );
}
