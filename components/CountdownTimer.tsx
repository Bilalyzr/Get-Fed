"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

// ---------------------------------------------------------------------------
// Live countdown to a deadline (PRD §42: countdown timers). Server deadline is
// authoritative; display-only client tick.
// ---------------------------------------------------------------------------

function format(ms: number): string {
  if (ms <= 0) return "Expired";
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = Math.floor((ms % 60_000) / 1000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (totalMinutes >= 1) return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  return `${seconds}s`;
}

export function CountdownTimer({
  deadline,
  expiredLabel = "Expired",
  className = "",
}: {
  deadline: string | Date;
  expiredLabel?: string;
  className?: string;
}) {
  const target = new Date(deadline).getTime();
  const [remaining, setRemaining] = useState(() => target - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(target - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  const urgent = remaining > 0 && remaining < 30 * 60_000;
  const expired = remaining <= 0;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold tabular-nums ${
        expired
          ? "text-stone-500"
          : urgent
          ? "text-rose-600"
          : "text-stone-700"
      } ${className}`}
      aria-label={expired ? expiredLabel : `${format(remaining)} remaining`}
    >
      <Timer className="h-4 w-4" aria-hidden />
      {expired ? expiredLabel : format(remaining)}
    </span>
  );
}
