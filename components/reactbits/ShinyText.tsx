"use client";

// ShinyText (reactbits.dev pattern) — a light sweep travelling across text.

export function ShinyText({
  children,
  className = "",
  speed = 3,
}: {
  children: React.ReactNode;
  className?: string;
  speed?: number;
}) {
  return (
    <span
      className={`fws-shiny-text ${className}`}
      style={{ animationDuration: `${speed}s` }}
    >
      {children}
    </span>
  );
}
