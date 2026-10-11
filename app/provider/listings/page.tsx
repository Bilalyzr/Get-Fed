"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, RefreshCw, ChevronRight, Utensils, Clock, AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useToast } from "@/components/Toast";
import { prismaListingRow } from "@/lib/types";

export default function ProviderListingsPage() {
  const [listings, setListings] = useState<prismaListingRow[] | null>(null);
  const [filter, setFilter] = useState<"active" | "all">("active");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const load = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setRefreshing(true);
      try {
        const res = await fetch("/api/provider/listings");
        const json = await res.json();
        if (json.success) setListings(json.data.listings);
      } catch {
        toast("error", "Could not load listings.");
      } finally {
        setRefreshing(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    load();
  }, [load]);

  async function cancelListing(id: string, name: string) {
    if (
      !window.confirm(
        `Cancel "${name}"? Outstanding claims will be cancelled and recipients notified. This cannot be undone.`
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/listings/${id}/cancel`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        toast("success", json.data.message);
        load();
      } else {
        toast("error", json.message ?? "Cancellation failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  const now = Date.now();
  const filtered = (listings ?? []).filter((l) =>
    filter === "active"
      ? !["EXPIRED", "CANCELLED", "COLLECTED"].includes(l.status)
      : true
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zen-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
              Kitchen Inventory Management
            </span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-ink">
            Surplus Listings
          </h1>
          <p className="mt-1 text-sm text-zen-muted">
            Track published meal batches, verify remaining portions, and manage live pickup windows.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => load(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zen-border bg-white px-3.5 py-2 text-xs font-semibold text-zen-text shadow-subtle hover:bg-surface-soft active:scale-95 transition-all"
            disabled={refreshing}
            aria-label="Refresh listings"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-zen-muted ${refreshing ? "animate-spin text-primary" : ""}`}
            />
            <span>Sync</span>
          </button>
          <Link
            href="/provider/listings/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-soft hover:bg-primary-hover active:scale-95 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Listing</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 rounded-xl border border-zen-border bg-white p-1 shadow-subtle" role="tablist">
          {(["active", "all"] as const).map((value) => (
            <button
              key={value}
              role="tab"
              aria-selected={filter === value}
              onClick={() => setFilter(value)}
              className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-all ${
                filter === value
                  ? "bg-primary text-white shadow-subtle font-semibold"
                  : "text-zen-muted hover:text-ink hover:bg-page/50"
              }`}
            >
              {value === "active" ? "Active Batches" : "All Batches"}
            </button>
          ))}
        </div>
        <span className="text-xs font-mono text-zen-muted">
          Showing {filtered.length} batch{filtered.length === 1 ? "" : "es"}
        </span>
      </div>

      {!listings ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-zen-border bg-white p-12 text-center shadow-subtle">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-soft text-primary border border-zen-border">
            <Utensils className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-serif text-lg font-bold text-ink">
            {filter === "active" ? "No Active Batches Right Now" : "No Listings Published"}
          </h3>
          <p className="mt-1 text-xs text-zen-muted max-w-sm mx-auto">
            {filter === "active"
              ? "All your earlier surplus listings have concluded or been collected."
              : "Publish your first surplus food batch to make it available for campus rescue."}
          </p>
          <Link
            href="/provider/listings/new"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white shadow-subtle hover:bg-primary-hover active:scale-95 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create First Listing</span>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2" role="list">
          {filtered.map((listing) => {
            const active = new Date(listing.pickupDeadline).getTime() > now;
            const portionPercent = Math.round(
              ((listing.totalQuantity - listing.availableQuantity) / listing.totalQuantity) * 100
            );

            return (
              <div
                key={listing.id}
                className="group flex flex-col justify-between rounded-2xl border border-zen-border bg-white p-5 shadow-subtle hover:border-primary-soft hover:shadow-soft transition-all duration-300"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-serif text-lg font-bold text-ink group-hover:text-primary transition-colors truncate">
                        {listing.foodName}
                      </h2>
                      <p className="mt-0.5 text-xs font-mono text-zen-muted">
                        <span className="font-bold text-primary">{listing.availableQuantity}</span> of{" "}
                        {listing.totalQuantity} {listing.unit.toLowerCase()} available ·{" "}
                        <span className="font-semibold text-ink">{listing.claimCount}</span> claim
                        {listing.claimCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <StatusBadge status={listing.status} />
                  </div>

                  {/* Progress bar of claimed portions */}
                  <div className="mt-3.5">
                    <div className="flex justify-between text-[11px] font-mono text-zen-muted mb-1">
                      <span>Portions Reserved</span>
                      <span>{portionPercent}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-soft/60">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${Math.min(portionPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-zen-border flex items-center justify-between gap-2">
                  <div>
                    {active && !["COLLECTED", "CANCELLED", "EXPIRED"].includes(listing.status) ? (
                      <CountdownTimer deadline={listing.pickupDeadline} />
                    ) : (
                      <span className="text-[11px] font-mono text-zen-muted">
                        Concluded
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!["COLLECTED", "CANCELLED", "EXPIRED"].includes(listing.status) && (
                      <button
                        onClick={() => cancelListing(listing.id, listing.foodName)}
                        disabled={busy}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 active:scale-95 transition-all disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                    <Link
                      href={`/provider/listings/${listing.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-zen-border bg-page px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-soft transition-all"
                    >
                      <span>Details</span>
                      <ChevronRight className="h-3.5 w-3.5 text-zen-muted" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
