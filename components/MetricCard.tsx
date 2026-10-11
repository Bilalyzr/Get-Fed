"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";
import { SpotlightCard, CountUp } from "@/components/reactbits";

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
  const toneClasses: Record<string, { bg: string; text: string; border: string }> = {
    default: {
      bg: "bg-surface-soft/60",
      text: "text-zen-text",
      border: "border-zen-border",
    },
    success: {
      bg: "bg-primary-faint/60",
      text: "text-primary",
      border: "border-primary-soft/50",
    },
    warning: {
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "border-amber-200",
    },
    danger: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
    },
    info: {
      bg: "bg-sky-50",
      text: "text-sky-800",
      border: "border-sky-200",
    },
  };

  const selectedTone = toneClasses[tone] ?? toneClasses.default;

  // Parse numeric values for CountUp
  const numeric = typeof value === "number" ? value : Number(String(value).replace(/[,%\s]/g, ""));
  const isNumeric = Number.isFinite(numeric) && String(value).match(/^[\d,.%\s]+$/);
  const suffix = typeof value === "string" && value.trim().endsWith("%") ? "%" : "";

  return (
    <SpotlightCard className="card p-4 sm:p-5 transition-all duration-300 hover:border-primary-soft hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-mono font-bold uppercase tracking-wider text-zen-muted">
            {label}
          </p>
          <p className="mt-2 text-2xl sm:text-3xl font-serif font-bold text-ink tabular-nums">
            {animateValue && isNumeric ? (
              <CountUp value={numeric} suffix={suffix} duration={1.2} />
            ) : (
              value
            )}
          </p>
          {hint && (
            <p className="mt-1 text-[11px] font-mono font-medium text-primary">
              ★ {hint}
            </p>
          )}
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${selectedTone.bg} ${selectedTone.text} ${selectedTone.border} shadow-subtle`}
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </SpotlightCard>
  );
}
