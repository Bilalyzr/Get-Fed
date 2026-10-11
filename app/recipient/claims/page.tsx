"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, MapPin, Navigation, QrCode, XCircle, ClipboardList, ArrowRight, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useToast } from "@/components/Toast";

type ClaimRow = {
  id: string;
  quantity: number;
  status: string;
  claimedAt: string;
  cancelledAt: string | null;
  collectedAt: string | null;
  createdAt: string;
  listing: {
    id: string;
    foodName: string;
    unit: string;
    pickupDeadline: string;
    pickupAddress: string;
    status: string;
    latitude: number;
    longitude: number;
    provider: { organisationName: string };
    expired: boolean;
  };
};

export default function RecipientClaimsPage() {
  const { toast } = useToast();
  const [claims, setClaims] = useState<ClaimRow[] | null>(null);
  const [filter, setFilter] = useState<"active" | "past">("active");
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setRefreshing(true);
      try {
        const res = await fetch(`/api/claims/me?status=${filter}`);
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

  async function cancelClaim(claim: ClaimRow) {
    if (
      !window.confirm(
        `Cancel your reservation of ${claim.quantity} ${claim.listing.unit.toLowerCase()}? ` +
          `If the pickup deadline hasn't passed, the quantity returns immediately to the listing.`
      )
    ) {
      return;
    }
    setBusy(claim.id);
    try {
      const res = await fetch(`/api/claims/${claim.id}/cancel`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        toast("success", json.data.message);
        load();
      } else {
        toast("error", json.message ?? "Cancellation failed.");
      }
    } finally {
      setBusy(null);
    }
  }

  async function startPickup(claim: ClaimRow) {
    setBusy(claim.id);
    try {
      const res = await fetch(`/api/claims/${claim.id}/pickup`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        toast("success", json.data.message);
        load();
      } else {
        toast("error", json.message ?? "Failed.");
      }
    } finally {
      setBusy(null);
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
              Allocation Ledger
            </span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-ink">
            My Rescue Claims
          </h1>
          <p className="mt-1 text-sm text-zen-muted">
            Manage your active reservations, generate cryptographic QR tokens, or verify collection history.
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
            href="/recipient/food"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-soft hover:bg-primary-hover active:scale-95 transition-all"
          >
            <span>Discover Food</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 rounded-xl border border-zen-border bg-white p-1 shadow-subtle" role="tablist">
          {(["active", "past"] as const).map((value) => (
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
              {value === "active" ? "Active Claims" : "Past Rescues"}
            </button>
          ))}
        </div>
        <span className="text-xs font-mono text-zen-muted">
          {claims?.length ?? 0} {filter} record{claims?.length === 1 ? "" : "s"}
        </span>
      </div>

      {!claims ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <div className="rounded-3xl border border-zen-border bg-white p-12 text-center shadow-subtle">
          <ClipboardList className="mx-auto h-12 w-12 text-zen-muted/60" />
          <h3 className="mt-4 font-serif text-lg font-bold text-ink">
            No {filter} Claims Found
          </h3>
          <p className="mt-1 text-xs text-zen-muted max-w-sm mx-auto">
            {filter === "active"
              ? "You don't have any pending surplus claims right now. Explore active campus batches to reserve meals."
              : "No historical completed collections yet."}
          </p>
          <Link
            href="/recipient/food"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white shadow-subtle hover:bg-primary-hover active:scale-95 transition-all"
          >
            <span>Explore Surplus Food</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4" role="list">
          {claims.map((claim) => {
            const active = ["RESERVED", "PICKUP_IN_PROGRESS"].includes(claim.status);
            return (
              <div
                key={claim.id}
                className="group rounded-2xl border border-zen-border bg-white p-5 shadow-subtle hover:border-primary-soft hover:shadow-soft transition-all duration-300"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="font-serif text-lg font-bold text-ink">
                        {claim.listing.foodName}
                      </h2>
                      <span className="rounded-full bg-primary-faint px-2.5 py-0.5 text-xs font-mono font-bold text-primary">
                        {claim.quantity} {claim.listing.unit.toLowerCase()}
                      </span>
                      <StatusBadge status={claim.status} />
                    </div>

                    <p className="mt-1 text-xs font-mono text-zen-muted">
                      Provider: <strong className="text-ink font-semibold">{claim.listing.provider.organisationName}</strong>
                    </p>

                    <p className="mt-2 flex items-center gap-1.5 text-xs text-zen-muted">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                      <span>{claim.listing.pickupAddress}</span>
                    </p>

                    {active && !claim.listing.expired && (
                      <div className="mt-3">
                        <CountdownTimer deadline={claim.listing.pickupDeadline} />
                      </div>
                    )}

                    {claim.collectedAt && (
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs font-mono text-primary font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>
                          Collected on{" "}
                          {new Date(claim.collectedAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {active && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/recipient/qr?claim=${claim.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-subtle hover:bg-primary-hover active:scale-95 transition-all"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        <span>Show QR Token</span>
                      </Link>

                      {claim.status === "RESERVED" && (
                        <button
                          onClick={() => startPickup(claim)}
                          disabled={busy === claim.id}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-zen-border bg-page px-3.5 py-2 text-xs font-semibold text-ink hover:bg-surface-soft active:scale-95 transition-all disabled:opacity-50"
                        >
                          <Navigation className="h-3.5 w-3.5 text-primary" />
                          <span>On The Way</span>
                        </button>
                      )}

                      <a
                        href={`https://www.openstreetmap.org/directions?to=${claim.listing.latitude},${claim.listing.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-xl border border-zen-border bg-white px-3 py-2 text-xs font-semibold text-zen-text hover:bg-surface-soft transition-all"
                      >
                        <Navigation className="h-3 w-3 text-primary" />
                        <span>Map</span>
                      </a>

                      {!claim.listing.expired && (
                        <button
                          onClick={() => cancelClaim(claim)}
                          disabled={busy === claim.id}
                          className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-all disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
