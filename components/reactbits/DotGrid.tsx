"use client";

// DotGrid (reactbits.dev pattern) — CSS dot lattice with a soft radial mask.

export function DotGrid({
  className = "",
  dotColor = "rgba(22,163,74,0.35)",
  size = 22,
}: {
  className?: string;
  dotColor?: string;
  size?: number;
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      aria-hidden
      style={{
        backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1.4px)`,
        backgroundSize: `${size}px ${size}px`,
        maskImage: "radial-gradient(ellipse 75% 65% at 50% 40%, black 35%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 75% 65% at 50% 40%, black 35%, transparent 100%)",
      }}
    />
  );
}
