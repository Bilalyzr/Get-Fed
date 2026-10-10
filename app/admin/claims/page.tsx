"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";

type ClaimRow = {
  id: string;
  quantity: number;
  status: string;
  createdAt: string;
  collectedAt: string | null;
  cancelledAt: string | null;
  listing: { foodName: string; unit: string; status: string };
  recipient: { organisationName: string; verificationStatus: string };
};

export default function AdminClaimsPage() {
  const { toast } = useToast();
  const [claims, setClaims] = useState<ClaimRow[] | null>(null);
  const [filter, setFilter] = useState<string>("");

  const load = useCallback(async () => {
    try {
      const params = filter ? `?status=${filter}` : "";
      const res = await fetch(`/api/admin/claims${params}`);
      const json = await res.json();
      if (json.success) setClaims(json.data);
    } catch {
      toast("error", "Could not load claims.");
    }
  }, [filter, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const STATUSES = ["", "RESERVED", "PICKUP_IN_PROGRESS", "COLLECTED", "CANCELLED", "NO_SHOW", "EXPIRED"];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">All claims</h1>
          <p className="text-sm text-stone-500">
            Review cancellations, no-shows and disputes.
          </p>
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

      {!claims ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <p className="card p-10 text-center text-sm text-stone-500">No claims found.</p>
      ) : (
        <ul className="card divide-y divide-stone-100" role="list">
          {claims.map((claim) => (
            <li key={claim.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-semibold text-stone-900">
                  {claim.recipient.organisationName} — {claim.quantity}{" "}
                  {claim.listing.unit.toLowerCase()} of {claim.listing.foodName}
                </p>
                <p className="mt-0.5 text-xs text-stone-400">
                  Claimed{" "}
                  {new Date(claim.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                  {claim.collectedAt &&
                    ` · collected ${new Date(claim.collectedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={claim.recipient.verificationStatus} />
                <StatusBadge status={claim.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
