"use client";

// Aurora (reactbits.dev pattern) — soft drifting colour veils via layered
// CSS radial gradients. Zero JS on the main thread.

export function Aurora({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <div className="fws-aurora fws-aurora-a" />
      <div className="fws-aurora fws-aurora-b" />
      <div className="fws-aurora fws-aurora-c" />
    </div>
  );
}
