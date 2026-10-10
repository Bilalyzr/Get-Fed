"use client";

import { useEffect, useRef, useState } from "react";

// CountUp (reactbits.dev pattern) — number animates from 0 to value on view.
// IntersectionObserver starts the animation, with a synchronous in-viewport
// fallback so numbers can never stay stuck at 0 in throttled webviews.

export function CountUp({
  value,
  duration = 1.6,
  decimals = 0,
  suffix = "",
  prefix = "",
  className = "",
}: {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    function run() {
      if (started.current) return;
      started.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / (duration * 1000), 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        setDisplay(value * eased);
        if (progress < 1) requestAnimationFrame(tick);
        else setDisplay(value);
      };
      requestAnimationFrame(tick);
    }

    // Fallback: already within the viewport on mount → run immediately.
    const rect = node.getBoundingClientRect();
    const inViewport =
      rect.top < window.innerHeight * 0.95 && rect.bottom > 0;
    if (inViewport) {
      run();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {display.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
