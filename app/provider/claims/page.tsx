"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, ScanLine, UserX, ChevronRight, Navigation } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useToast } from "@/components/Toast";
import type { ProviderClaimRow } from "@/lib/types";

export default function ProviderClaimsPage() {
  const [claims, setClaims] = useState<ProviderClaimRow[] | null>(null);
  const [filter, setFilter] = useState<"active" | "completed" | "all">("active");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/provider/claims?filter=${filter}`);
      const json = await res.json();
      if (json.success) setClaims(json.data);
    } catch {
      toast("error", "Could not load claims.");
    }
  }, [filter, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function markNoShow(claimId: string) {
    if (!window.confirm("Mark this recipient as a no-show?")) return;
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">Claims on my listings</h1>
          <p className="text-sm text-stone-500">
            Verify pickups with the scanner; manage reservations here.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary" aria-label="Refresh claims">
            <RefreshCw className="h-4 w-4" aria-hidden />
          </button>
          <Link href="/provider/scanner" className="btn-primary">
            <ScanLine className="h-4 w-4" aria-hidden />
            Open scanner
          </Link>
        </div>
      </div>

      <div className="flex gap-2" role="tablist" aria-label="Claim filter">
        {(["active", "completed", "all"] as const).map((value) => (
          <button
            key={value}
            role="tab"
            aria-selected={filter === value}
            onClick={() => setFilter(value)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium capitalize ${
              filter === value
                ? "bg-green-700 text-white"
                : "bg-white text-stone-600 ring-1 ring-stone-300 hover:bg-stone-50"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      {!claims ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20" />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <div className="card p-10 text-center text-sm text-stone-500">
          No {filter === "all" ? "" : filter} claims yet.
        </div>
      ) : (
        <ul className="card divide-y divide-stone-100" role="list">
          {claims.map((claim) => (
            <li key={claim.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-900">
                  {claim.recipientOrg} — {claim.quantity} {claim.unit.toLowerCase()} of{" "}
                  {claim.foodName}
                </p>
                <p className="mt-0.5 text-xs text-stone-400">
                  Reserved{" "}
                  {new Date(claim.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
                {["RESERVED", "PICKUP_IN_PROGRESS"].includes(claim.status) && !claim.expired && (
                  <p className="mt-1 text-sm">
                    <CountdownTimer deadline={claim.pickupDeadline} />
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={claim.status} />
                {["RESERVED", "PICKUP_IN_PROGRESS"].includes(claim.status) && (
                  <>
                    <Link
                      href={`/provider/tracking/${claim.id}`}
                      className="btn-secondary !px-3 !py-1.5 text-xs"
                      title="Live pickup journey"
                    >
                      <Navigation className="h-3.5 w-3.5" aria-hidden />
                      Track
                    </Link>
                    <button
                      onClick={() => markNoShow(claim.id)}
                      disabled={busy}
                      className="btn-secondary !px-3 !py-1.5 text-xs"
                      title="Mark as no-show"
                    >
                      <UserX className="h-3.5 w-3.5" aria-hidden />
                      No-show
                    </button>
                  </>
                )}
                <Link
                  href={`/provider/listings/${(claim as { listingId?: string }).listingId ?? ""}`}
                  className="btn-ghost !px-2 text-xs"
                  aria-label="View listing"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
