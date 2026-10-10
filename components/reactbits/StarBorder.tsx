"use client";

// StarBorder (reactbits.dev pattern) — conic-gradient comets orbiting a
// rounded border around the wrapped content.

export function StarBorder({
  children,
  className = "",
  color = "#16a34a",
  speed = "6s",
  thickness = 1.5,
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
  speed?: string;
  thickness?: number;
}) {
  return (
    <div className={`fws-star-border-container ${className}`} style={{ padding: thickness }}>
      <div
        className="fws-star-border-edge"
        aria-hidden
        style={{
          background: `conic-gradient(from calc(var(--fws-star-angle) * 1deg), transparent 0%, ${color} 6%, transparent 9%)`,
          animationDuration: speed,
        }}
      />
      <div className="fws-star-border-content">{children}</div>
    </div>
  );
}
