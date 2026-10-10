"use client";

import { useRef, useState } from "react";

// TiltedCard (reactbits.dev pattern) — subtle 3D tilt following the cursor
// with a moving specular highlight. Disabled on touch/reduced-motion via CSS.

export function TiltedCard({
  children,
  className = "",
  maxTilt = 8,
}: {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  function onMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    setStyle({
      transform: `perspective(900px) rotateX(${(-py * maxTilt).toFixed(2)}deg) rotateY(${(px * maxTilt).toFixed(2)}deg) translateZ(0)`,
      ["--fws-tilt-x" as string]: `${(px * 100 + 50).toFixed(1)}%`,
      ["--fws-tilt-y" as string]: `${(py * 100 + 50).toFixed(1)}%`,
    });
  }

  return (
    <div
      ref={ref}
      className={`fws-tilt group/tilt ${className}`}
      style={style}
      onMouseMove={onMove}
      onMouseLeave={() => setStyle({ transform: "perspective(900px) rotateX(0deg) rotateY(0deg)" })}
    >
      {children}
    </div>
  );
}
