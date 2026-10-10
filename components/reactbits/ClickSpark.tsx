"use client";

import { useCallback, useRef, useState } from "react";

// ClickSpark (reactbits.dev pattern) — small sparks burst from the click
// point inside the wrapped element. Wraps any button for tactile feedback.

type Spark = { x: number; y: number; id: number };

export function ClickSpark({
  children,
  sparkColor = "#4ade80",
  sparkCount = 8,
  className = "",
}: {
  children: React.ReactNode;
  sparkColor?: string;
  sparkCount?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sparks, setSparks] = useState<Spark[]>([]);

  const spark = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const batch = Array.from({ length: sparkCount }, (_, i) => ({
        x,
        y,
        id: Date.now() + i,
      }));
      setSparks((prev) => [...prev, ...batch]);
      setTimeout(() => {
        setSparks((prev) => prev.filter((s) => !batch.includes(s)));
      }, 650);
    },
    [sparkCount]
  );

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onClick={spark}
      style={{ ["--fws-spark-color" as string]: sparkColor }}
    >
      {children}
      {sparks.map((s) => (
        <svg
          key={s.id}
          className="fws-spark pointer-events-none absolute z-10"
          style={{ left: s.x - 8, top: s.y - 8 }}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          aria-hidden
        >
          <path
            d="M8 0 L8 16 M0 8 L16 8"
            stroke="var(--fws-spark-color)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      ))}
    </div>
  );
}
