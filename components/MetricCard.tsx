"use client";

import type { LucideIcon } from "lucide-react";
import { SpotlightCard, CountUp } from "@/components/reactbits";

// Metric card (PRD §41–§43 dashboards) — ReactBits SpotlightCard with a
// cursor-tracked spotlight and a CountUp entrance for the value.

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
  animateValue = true,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  hint?: string;
  animateValue?: boolean;
}) {
  const tones: Record<string, string> = {
    default: "bg-stone-100 text-stone-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-rose-100 text-rose-700",
    info: "bg-sky-100 text-sky-700",
  };

  // Parse "45%" / "1,846" style values so CountUp can animate them.
  const numeric = typeof value === "number" ? value : Number(String(value).replace(/[,%\s]/g, ""));
  const isNumeric = Number.isFinite(numeric) && String(value).match(/^[\d,.%\s]+$/);
  const suffix = typeof value === "string" && value.trim().endsWith("%") ? "%" : "";

  return (
    <SpotlightCard className="card p-4 transition-shadow hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-stone-500">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-stone-900 sm:text-3xl">
            {animateValue && isNumeric ? (
              <CountUp value={numeric} suffix={suffix} duration={1.4} />
            ) : (
              value
            )}
          </p>
          {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
        </div>
        <span className={`rounded-xl p-2.5 ${tones[tone]}`} aria-hidden>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </SpotlightCard>
  );
}
