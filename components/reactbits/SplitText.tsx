"use client";

import { motion } from "framer-motion";

// SplitText (reactbits.dev pattern) — per-character spring reveal.
// Letters are grouped into word spans so line breaking never splits a word.

export function SplitText({
  text,
  className = "",
  delay = 60,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  delay?: number;
  as?: "span" | "h1" | "h2" | "p";
}) {
  const words = text.split(" ");
  let letterIndex = -1;

  return (
    <Tag className={className} aria-label={text}>
      {words.map((word, wordIndex) => (
        <span key={`${word}-${wordIndex}`} aria-hidden className="inline-block whitespace-nowrap">
          {Array.from(word).map((letter) => {
            letterIndex += 1;
            return (
              <motion.span
                key={`${letter}-${letterIndex}`}
                className="inline-block"
                initial={{ opacity: 0, y: 24, rotateX: -70 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{
                  delay: letterIndex * (delay / 1000),
                  duration: 0.45,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {letter}
              </motion.span>
            );
          })}
          {wordIndex < words.length - 1 ? "\u00A0" : null}
        </span>
      ))}
    </Tag>
  );
}
