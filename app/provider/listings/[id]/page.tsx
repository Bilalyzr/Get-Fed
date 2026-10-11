"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Ban,
  MapPin,
  Clock3,
  Utensils,
  Users,
  RefreshCw,
  Loader2,
  Navigation,
  UserX,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { CountdownTimer } from "@/components/CountdownTimer";
import { MapViewDynamic } from "@/components/MapView";
import { useToast } from "@/components/Toast";
import { BackButton } from "@/components/BackButton";

type ClaimRow = {
  id: string;
  quantity: number;
  status: string;
  recipientOrg: string;
  recipientName: string;
  createdAt: string;
};

type MatchRow = {
  recipientId: string;
  recipientName: string;
  organisationName: string;
  distanceKm: number;
  etaMinutes: number;
  matchScore: number;
};

export default function ProviderListingDetailPage() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const [data, setData] = useState<{
    listing: Record<string, unknown> & { [k: string]: unknown };
    claims: ClaimRow[];
    matches: MatchRow[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"claims" | "matches">("claims");

  const load = useCallback(async () => {
    try {
      const [listingRes, claimsRes] = await Promise.all([
        fetch(`/api/listings/${params.id}`),
        fetch(`/api/provider/listings/${params.id}/claims`),
      ]);
      const listingJson = await listingRes.json();
      const claimsJson = await claimsRes.json();

      let matches: MatchRow[] = [];
      if (listingJson.success) {
        const matchRes = await fetch(`/api/listings/${params.id}/matches`);
        const matchJson = await matchRes.json();
        if (matchJson.success && Array.isArray(matchJson.data)) {
          matches = matchJson.data;
        }
      }

      if (listingJson.success) {
        setData({
          listing: listingJson.data.listing,
          claims: claimsJson.success ? claimsJson.data : [],
          matches,
        });
      } else {
        toast("error", "Listing not found.");
      }
    } catch {
      toast("error", "Could not load listing.");
    } finally {
      setLoading(false);
    }
  }, [params.id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function cancelListing() {
    if (!data) return;
    if (
      !window.confirm(
        `Cancel "${data.listing.foodName}"? Outstanding claims will be cancelled and recipients notified.`
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/listings/${params.id}/cancel`, { method: "POST" });
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

  async function markNoShow(claimId: string) {
    if (!window.confirm("Mark this recipient as a no-show? The quantity may return to available.")) {
      return;
    }
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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-64" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card p-10 text-center text-sm text-stone-500">
        Listing not found.{" "}
        <Link href="/provider/listings" className="font-semibold text-green-700">
          Back to listings
        </Link>
      </div>
    );
  }

  const l = data.listing as {
    id: string;
    foodName: string;
    description: string;
    status: string;
    totalQuantity: number;
    availableQuantity: number;
    unit: string;
    preparedAt: string;
    availableFrom: string;
    pickupDeadline: string;
    pickupAddress: string;
    latitude: number;
    longitude: number;
    category: string;
    allergenNotes?: string | null;
    packagingType?: string | null;
    notes?: string | null;
  };

  const active = new Date(l.pickupDeadline).getTime() > Date.now();
  const cancellable = !["COLLECTED", "CANCELLED", "EXPIRED"].includes(l.status);
  const claimedPct = l.totalQuantity > 0
    ? Math.round(((l.totalQuantity - l.availableQuantity) / l.totalQuantity) * 100)
    : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <BackButton fallbackHref="/provider/listings" label="Back to listings" />
        <button onClick={load} className="btn-secondary !px-3" aria-label="Refresh">
          <RefreshCw className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold text-stone-900">{l.foodName}</h1>
              <StatusBadge status={l.status} size="md" />
            </div>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-stone-600">
              {l.description}
            </p>
          </div>
          {cancellable && (
            <button onClick={cancelListing} disabled={busy} className="btn-danger">
              <Ban className="h-4 w-4" aria-hidden />
              Cancel listing
            </button>
          )}
        </div>

        {/* Quantity progress */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-semibold text-stone-900">
              <Utensils className="h-4 w-4 text-green-700" aria-hidden />
              {l.availableQuantity} of {l.totalQuantity} {l.unit.toLowerCase()} available
            </span>
            <span className="text-stone-500">{claimedPct}% claimed</span>
          </div>
          <div
            className="mt-2 h-2.5 overflow-hidden rounded-full bg-stone-100"
            role="progressbar"
            aria-valuenow={claimedPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Percentage claimed"
          >
            <div
              className="h-full rounded-full bg-green-600 transition-all"
              style={{ width: `${claimedPct}%` }}
            />
          </div>
        </div>

        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <Clock3 className="mt-0.5 h-4 w-4 text-stone-400" aria-hidden />
            <div>
              <dt className="font-medium text-stone-700">Pickup deadline</dt>
              <dd className="mt-0.5 text-stone-600">
                {new Date(l.pickupDeadline).toLocaleString("en-US", {
                  weekday: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {active && " · "}
                {active && <CountdownTimer deadline={l.pickupDeadline} />}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 text-stone-400" aria-hidden />
            <div>
              <dt className="font-medium text-stone-700">Pickup location</dt>
              <dd className="mt-0.5 text-stone-600">{l.pickupAddress}</dd>
              <dd className="mt-0.5 text-xs text-stone-400">
                {l.latitude.toFixed(5)}, {l.longitude.toFixed(5)}
              </dd>
            </div>
          </div>
          <div>
            <dt className="font-medium text-stone-700">Prepared</dt>
            <dd className="mt-0.5 text-stone-600">
              {new Date(l.preparedAt).toLocaleString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-stone-700">Available from</dt>
            <dd className="mt-0.5 text-stone-600">
              {new Date(l.availableFrom).toLocaleString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </dd>
          </div>
          {l.allergenNotes && (
            <div className="sm:col-span-2">
              <dt className="font-medium text-stone-700">Allergen notes</dt>
              <dd className="mt-0.5 text-stone-600">{l.allergenNotes}</dd>
            </div>
          )}
          {l.packagingType && (
            <div className="sm:col-span-2">
              <dt className="font-medium text-stone-700">Packaging</dt>
              <dd className="mt-0.5 text-stone-600">{l.packagingType}</dd>
            </div>
          )}
          {l.notes && (
            <div className="sm:col-span-2">
              <dt className="font-medium text-stone-700">Notes</dt>
              <dd className="mt-0.5 text-stone-600">{l.notes}</dd>
            </div>
          )}
        </dl>

        <div className="mt-5">
          <MapViewDynamic
            center={{ latitude: l.latitude, longitude: l.longitude }}
            markers={[
              {
                id: l.id,
                latitude: l.latitude,
                longitude: l.longitude,
                label: l.foodName,
                sublabel: l.pickupAddress,
              },
            ]}
            height="220px"
            zoom={15}
          />
          <a
            href={`https://www.openstreetmap.org/?mlat=${l.latitude}&mlon=${l.longitude}#map=16/${l.latitude}/${l.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost mt-2 text-xs"
          >
            <Navigation className="h-3.5 w-3.5" aria-hidden />
            Open in OpenStreetMap
          </a>
        </div>
      </div>

      {/* Tabs: claims & matches */}
      <div className="flex gap-2" role="tablist" aria-label="Listing details">
        <button
          role="tab"
          aria-selected={tab === "claims"}
          onClick={() => setTab("claims")}
          className={`rounded-lg px-3.5 py-1.5 text-sm font-medium ${
            tab === "claims"
              ? "bg-green-700 text-white"
              : "bg-white text-stone-600 ring-1 ring-stone-300 hover:bg-stone-50"
          }`}
        >
          Claims ({data.claims.length})
        </button>
        <button
          role="tab"
          aria-selected={tab === "matches"}
          onClick={() => setTab("matches")}
          className={`rounded-lg px-3.5 py-1.5 text-sm font-medium ${
            tab === "matches"
              ? "bg-green-700 text-white"
              : "bg-white text-stone-600 ring-1 ring-stone-300 hover:bg-stone-50"
          }`}
        >
          Matches ({data.matches.length})
        </button>
      </div>

      {tab === "claims" ? (
        data.claims.length === 0 ? (
          <div className="card p-8 text-center text-sm text-stone-500">
            No claims yet on this listing.
          </div>
        ) : (
          <ul className="card divide-y divide-stone-100" role="list">
            {data.claims.map((claim) => (
              <li key={claim.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-semibold text-stone-900">
                    <Users className="mr-1 inline h-4 w-4 text-stone-400" aria-hidden />
                    {claim.recipientOrg} — {claim.quantity} {l.unit.toLowerCase()}
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
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={claim.status} />
                  {["RESERVED", "PICKUP_IN_PROGRESS"].includes(claim.status) && (
                    <button
                      onClick={() => markNoShow(claim.id)}
                      disabled={busy}
                      className="btn-secondary !px-3 !py-1.5 text-xs"
                      title="Mark recipient as no-show"
                    >
                      <UserX className="h-3.5 w-3.5" aria-hidden />
                      No-show
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="card divide-y divide-stone-100">
          {data.matches.length === 0 ? (
            <p className="p-8 text-center text-sm text-stone-500">
              No eligible matched recipients right now.
            </p>
          ) : (
            data.matches.map((m) => (
              <div key={m.recipientId} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-semibold text-stone-900">{m.organisationName}</p>
                  <p className="text-xs text-stone-500">
                    {m.distanceKm} km · ETA ~{m.etaMinutes} min
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold tabular-nums text-green-700">
                    {m.matchScore}
                  </p>
                  <p className="text-[11px] uppercase tracking-wide text-stone-400">
                    Match score
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {busy && (
        <p className="flex items-center gap-2 text-sm text-stone-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Working…
        </p>
      )}
    </div>
  );
}
