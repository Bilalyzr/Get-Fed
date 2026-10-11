"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, ScanLine, UserX, ChevronRight, Navigation, ClipboardList, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useToast } from "@/components/Toast";
import type { ProviderClaimRow } from "@/lib/types";

export default function ProviderClaimsPage() {
  const [claims, setClaims] = useState<ProviderClaimRow[] | null>(null);
  const [filter, setFilter] = useState<"active" | "completed" | "all">("active");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const load = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setRefreshing(true);
      try {
        const res = await fetch(`/api/provider/claims?filter=${filter}`);
        const json = await res.json();
        if (json.success) setClaims(json.data);
      } catch {
        toast("error", "Could not load claims.");
      } finally {
        setRefreshing(false);
      }
    },
    [filter, toast]
  );

  useEffect(() => {
    load();
  }, [load]);

  async function markNoShow(claimId: string) {
    if (!window.confirm("Mark this recipient as a no-show? This records a non-collection penalty.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/claims/${claimId}/noshow`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        toast("success", json.data.message);
        load();
      } else {
        toast("error", json.message ?? "Failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zen-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
              Pickup Coordination Deck
            </span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-ink">
            Incoming Claims
          </h1>
          <p className="mt-1 text-sm text-zen-muted">
            Monitor reservations made by verified campus pantries and complete pickups using the scanner.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => load(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zen-border bg-white px-3.5 py-2 text-xs font-semibold text-zen-text shadow-subtle hover:bg-surface-soft active:scale-95 transition-all"
            disabled={refreshing}
            aria-label="Refresh claims"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-zen-muted ${refreshing ? "animate-spin text-primary" : ""}`}
            />
            <span>Sync</span>
          </button>
          <Link
            href="/provider/scanner"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-soft hover:bg-primary-hover active:scale-95 transition-all"
          >
            <ScanLine className="h-4 w-4" />
            <span>Launch Scanner</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 rounded-xl border border-zen-border bg-white p-1 shadow-subtle" role="tablist">
          {(["active", "completed", "all"] as const).map((value) => (
            <button
              key={value}
              role="tab"
              aria-selected={filter === value}
              onClick={() => setFilter(value)}
              className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-all capitalize ${
                filter === value
                  ? "bg-primary text-white shadow-subtle font-semibold"
                  : "text-zen-muted hover:text-ink hover:bg-page/50"
              }`}
            >
              {value} Claims
            </button>
          ))}
        </div>
        <span className="text-xs font-mono text-zen-muted">
          {claims?.length ?? 0} records
        </span>
      </div>

      {!claims ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <div className="rounded-3xl border border-zen-border bg-white p-12 text-center shadow-subtle">
          <ClipboardList className="mx-auto h-12 w-12 text-zen-muted/60" />
          <h3 className="mt-4 font-serif text-lg font-bold text-ink">
            No {filter === "all" ? "" : filter} Claims Found
          </h3>
          <p className="mt-1 text-xs text-zen-muted">
            When recipient organizations claim your listings, reservations will appear here for scan verification.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zen-border bg-white shadow-subtle divide-y divide-zen-border">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="flex flex-wrap items-center justify-between gap-4 p-5 hover:bg-page/40 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <p className="font-serif font-bold text-ink text-base">
                    {claim.recipientOrg}
                  </p>
                  <span className="rounded-full bg-primary-faint px-2.5 py-0.5 text-xs font-mono font-bold text-primary">
                    {claim.quantity} {claim.unit.toLowerCase()} reserved
                  </span>
                  <StatusBadge status={claim.status} />
                </div>
                <p className="mt-1 text-xs text-zen-muted font-mono truncate">
                  Listing Batch: <strong className="text-ink font-semibold">{claim.foodName}</strong>
                </p>
                <p className="mt-0.5 text-[11px] font-mono text-zen-faint">
                  Reserved{" "}
                  {new Date(claim.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
                {["RESERVED", "PICKUP_IN_PROGRESS"].includes(claim.status) && !claim.expired && (
                  <div className="mt-2.5">
                    <CountdownTimer deadline={claim.pickupDeadline} />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {["RESERVED", "PICKUP_IN_PROGRESS"].includes(claim.status) && (
                  <>
                    <Link
                      href={`/provider/tracking/${claim.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-zen-border bg-page px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-soft transition-all"
                      title="Live pickup telemetry"
                    >
                      <Navigation className="h-3.5 w-3.5 text-primary" />
                      <span>Track</span>
                    </Link>
                    <button
                      onClick={() => markNoShow(claim.id)}
                      disabled={busy}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-all disabled:opacity-50"
                      title="Mark as no-show"
                    >
                      <UserX className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
                <Link
                  href={`/provider/listings/${(claim as { listingId?: string }).listingId ?? ""}`}
                  className="rounded-lg p-2 text-zen-muted hover:text-ink hover:bg-surface-soft transition-colors"
                  aria-label="View listing"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
