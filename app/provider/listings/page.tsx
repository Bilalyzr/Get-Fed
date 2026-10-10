"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, RefreshCw, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useToast } from "@/components/Toast";
import { prismaListingRow } from "@/lib/types";

export default function ProviderListingsPage() {
  const [listings, setListings] = useState<prismaListingRow[] | null>(null);
  const [filter, setFilter] = useState<"active" | "all">("active");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/provider/listings");
      const json = await res.json();
      if (json.success) setListings(json.data.listings);
    } catch {
      toast("error", "Could not load listings.");
    }
  }, [toast]);

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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">My listings</h1>
          <p className="text-sm text-stone-500">Every surplus listing you have published.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary" aria-label="Refresh listings">
            <RefreshCw className="h-4 w-4" aria-hidden />
          </button>
          <Link href="/provider/listings/new" className="btn-primary">
            <PlusCircle className="h-4 w-4" aria-hidden />
            New listing
          </Link>
        </div>
      </div>

      <div className="flex gap-2" role="tablist" aria-label="Listing filter">
        {(["active", "all"] as const).map((value) => (
          <button
            key={value}
            role="tab"
            aria-selected={filter === value}
            onClick={() => setFilter(value)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium ${
              filter === value
                ? "bg-green-700 text-white"
                : "bg-white text-stone-600 ring-1 ring-stone-300 hover:bg-stone-50"
            }`}
          >
            {value === "active" ? "Active" : "All"}
          </button>
        ))}
      </div>

      {!listings ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-stone-500">
            {filter === "active" ? "No active listings right now." : "No listings yet."}
          </p>
          <Link href="/provider/listings/new" className="btn-primary mt-4">
            Publish surplus food
          </Link>
        </div>
      ) : (
        <ul className="space-y-3" role="list">
          {filtered.map((listing) => {
            const active = new Date(listing.pickupDeadline).getTime() > now;
            return (
              <li key={listing.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-stone-900">{listing.foodName}</h2>
                      <StatusBadge status={listing.status} />
                    </div>
                    <p className="mt-1.5 text-sm text-stone-600">
                      {listing.availableQuantity} of {listing.totalQuantity}{" "}
                      {listing.unit.toLowerCase()} available · {listing.claimCount} claim
                      {listing.claimCount === 1 ? "" : "s"}
                    </p>
                    <p className="mt-1 text-xs text-stone-400">
                      Created{" "}
                      {new Date(listing.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {active && !["COLLECTED", "CANCELLED", "EXPIRED"].includes(listing.status) && (
                      <CountdownTimer deadline={listing.pickupDeadline} />
                    )}
                    <div className="flex gap-2">
                      {!["COLLECTED", "CANCELLED", "EXPIRED"].includes(listing.status) && (
                        <button
                          onClick={() => cancelListing(listing.id, listing.foodName)}
                          disabled={busy}
                          className="btn-danger !px-3 !py-1.5 text-xs"
                        >
                          Cancel
                        </button>
                      )}
                      <Link
                        href={`/provider/listings/${listing.id}`}
                        className="btn-secondary !px-3 !py-1.5 text-xs"
                      >
                        Details
                        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
