"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// ---------------------------------------------------------------------------
// Smart back button: returns to the previous in-app page when there is one
// (same-origin history), otherwise falls back to a guaranteed destination.
// Decided at click time so it stays SSR-safe.
// ---------------------------------------------------------------------------

export function BackButton({
  fallbackHref,
  label = "Back",
  className = "",
}: {
  fallbackHref: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  function goBack() {
    const sameApp =
      typeof document !== "undefined" &&
      document.referrer.startsWith(window.location.origin) &&
      window.history.length > 1;
    if (sameApp) router.back();
    else router.push(fallbackHref);
  }

  return (
    <button
      onClick={goBack}
      className={`inline-flex items-center gap-1.5 rounded-full border border-zen-border bg-white px-3.5 py-1.5 text-xs font-semibold text-zen-muted shadow-subtle transition-colors hover:border-primary-soft hover:bg-surface-soft hover:text-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${className}`}
      aria-label={label}
    >
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
      <span>{label}</span>
    </button>
  );
}
