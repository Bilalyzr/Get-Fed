"use client";

import { useEffect, useRef, useState } from "react";

// DecryptedText (reactbits.dev pattern) — text resolves from random
// characters when it enters the viewport. Pure React, no deps.

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%";

export function DecryptedText({
  text,
  className = "",
  speed = 40,
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let frame = 0;
    const interval = setInterval(() => {
      frame += 1;
      const revealed = Math.floor(frame * 1.4);
      setDisplay(
        text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < revealed) return char;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("")
      );
      if (revealed >= text.length) {
        setDisplay(text);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [started, text, speed]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      <span aria-hidden>{started ? display : text.replace(/[^\s]/g, "\u00B7")}</span>
    </span>
  );
}
