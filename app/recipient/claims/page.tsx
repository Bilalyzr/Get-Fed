"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, MapPin, Navigation, QrCode, XCircle, Truck } from "lucide-react";
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

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/claims/me?status=${filter}`);
      const json = await res.json();
      if (json.success) setClaims(json.data);
    } catch {
      toast("error", "Could not load claims.");
    }
  }, [filter, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function cancelClaim(claim: ClaimRow) {
    if (
      !window.confirm(
        `Cancel your reservation of ${claim.quantity} ${claim.listing.unit.toLowerCase()}? ` +
          `If the pickup deadline hasn't passed, the quantity returns to the listing.`
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">My claims</h1>
          <p className="text-sm text-stone-500">
            Track reservations, show QR codes, cancel when plans change.
          </p>
        </div>
        <button onClick={load} className="btn-secondary" aria-label="Refresh claims">
          <RefreshCw className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="flex gap-2" role="tablist" aria-label="Claim filter">
        {(["active", "past"] as const).map((value) => (
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
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-32" />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-stone-500">
            No {filter} claims.{" "}
            <Link href="/recipient/food" className="font-semibold text-green-700">
              Discover food
            </Link>
          </p>
        </div>
      ) : (
        <ul className="space-y-3" role="list">
          {claims.map((claim) => {
            const active = ["RESERVED", "PICKUP_IN_PROGRESS"].includes(claim.status);
            return (
              <li key={claim.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-stone-900">{claim.listing.foodName}</h2>
                      <StatusBadge status={claim.status} />
                    </div>
                    <p className="mt-0.5 text-sm text-stone-600">
                      {claim.quantity} {claim.listing.unit.toLowerCase()} ·{" "}
                      {claim.listing.provider.organisationName}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-stone-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {claim.listing.pickupAddress}
                    </p>
                    {active && !claim.listing.expired && (
                      <p className="mt-2">
                        <CountdownTimer deadline={claim.listing.pickupDeadline} />
                      </p>
                    )}
                    {claim.collectedAt && (
                      <p className="mt-1 text-xs text-green-700">
                        Collected{" "}
                        {new Date(claim.collectedAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>

                  {active && (
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/recipient/qr?claim=${claim.id}`}
                        className="btn-primary !px-3 !py-1.5 text-xs"
                      >
                        <QrCode className="h-3.5 w-3.5" aria-hidden />
                        Show QR
                      </Link>
                      <Link
                        href={`/recipient/tracking/${claim.id}`}
                        className="btn-secondary !px-3 !py-1.5 text-xs"
                      >
                        <Truck className="h-3.5 w-3.5" aria-hidden />
                        Live track
                      </Link>
                      {claim.status === "RESERVED" && (
                        <button
                          onClick={() => startPickup(claim)}
                          disabled={busy === claim.id}
                          className="btn-secondary !px-3 !py-1.5 text-xs"
                        >
                          <Navigation className="h-3.5 w-3.5" aria-hidden />
                          I&apos;m on the way
                        </button>
                      )}
                      {!claim.listing.expired && (
                        <button
                          onClick={() => cancelClaim(claim)}
                          disabled={busy === claim.id}
                          className="btn-danger !px-3 !py-1.5 text-xs"
                        >
                          <XCircle className="h-3.5 w-3.5" aria-hidden />
                          Cancel
                        </button>
                      )}
                      <a
                        href={`https://www.openstreetmap.org/directions?to=${claim.listing.latitude},${claim.listing.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ghost !px-3 !py-1.5 text-xs"
                      >
                        <Navigation className="h-3.5 w-3.5" aria-hidden />
                        Directions
                      </a>
                    </div>
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
