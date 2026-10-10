"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useToast } from "@/components/Toast";

type ListingRow = {
  id: string;
  foodName: string;
  status: string;
  totalQuantity: number;
  availableQuantity: number;
  unit: string;
  pickupDeadline: string;
  createdAt: string;
  provider: { organisationName: string };
  claimCount: number;
};

export default function AdminListingsPage() {
  const { toast } = useToast();
  const [listings, setListings] = useState<ListingRow[] | null>(null);
  const [filter, setFilter] = useState<string>("");

  const load = useCallback(async () => {
    try {
      const params = filter ? `?status=${filter}` : "";
      const res = await fetch(`/api/admin/listings${params}`);
      const json = await res.json();
      if (json.success) setListings(json.data);
    } catch {
      toast("error", "Could not load listings.");
    }
  }, [filter, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const STATUSES = [
    "",
    "AVAILABLE",
    "PARTIALLY_RESERVED",
    "FULLY_RESERVED",
    "COLLECTED",
    "EXPIRED",
    "CANCELLED",
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">All listings</h1>
          <p className="text-sm text-stone-500">Platform-wide listing monitoring.</p>
        </div>
        <button onClick={load} className="btn-secondary" aria-label="Refresh">
          <RefreshCw className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Status filter">
        {STATUSES.map((status) => (
          <button
            key={status || "ALL"}
            role="tab"
            aria-selected={filter === status}
            onClick={() => setFilter(status)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              filter === status
                ? "bg-green-700 text-white"
                : "bg-white text-stone-600 ring-1 ring-stone-300 hover:bg-stone-50"
            }`}
          >
            {status ? status.replace(/_/g, " ").toLowerCase() : "all"}
          </button>
        ))}
      </div>

      {!listings ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <p className="card p-10 text-center text-sm text-stone-500">No listings found.</p>
      ) : (
        <ul className="card divide-y divide-stone-100" role="list">
          {listings.map((listing) => {
            const active = new Date(listing.pickupDeadline).getTime() > Date.now();
            return (
              <li key={listing.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-stone-900">{listing.foodName}</p>
                    <StatusBadge status={listing.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {listing.provider.organisationName} · {listing.availableQuantity}/
                    {listing.totalQuantity} {listing.unit.toLowerCase()} available ·{" "}
                    {listing.claimCount} claim{listing.claimCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="text-right text-xs text-stone-400">
                  {active && !["COLLECTED", "CANCELLED", "EXPIRED"].includes(listing.status) ? (
                    <CountdownTimer deadline={listing.pickupDeadline} />
                  ) : (
                    new Date(listing.pickupDeadline).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
