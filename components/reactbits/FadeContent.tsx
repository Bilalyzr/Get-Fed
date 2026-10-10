"use client";

import { motion } from "framer-motion";

// FadeContent (reactbits.dev pattern) — fade + rise entrance on view.

export function FadeContent({
  children,
  delay = 0,
  blur = true,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  blur?: boolean;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22, ...(blur ? { filter: "blur(6px)" } : {}) }}
      whileInView={{ opacity: 1, y: 0, ...(blur ? { filter: "blur(0px)" } : {}) }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
