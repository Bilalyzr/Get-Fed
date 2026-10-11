"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Ban, MapPin, Clock3, Utensils, RefreshCw, Navigation, UserX, ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { CountdownTimer } from "@/components/CountdownTimer";
import { MapViewDynamic } from "@/components/MapView";
import { useToast } from "@/components/Toast";

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
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-3xl border border-zen-border bg-white p-12 text-center shadow-subtle">
        <h2 className="font-serif text-lg font-bold text-ink">Listing Not Found</h2>
        <p className="mt-1 text-xs text-zen-muted">
          The requested surplus batch does not exist or has been removed.
        </p>
        <Link
          href="/provider/listings"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-subtle hover:bg-primary-hover transition-colors"
        >
          <span>Back to Listings</span>
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
    <div className="space-y-6">
      {/* Back & Refresh */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/provider/listings"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zen-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Listings Inventory</span>
        </Link>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zen-border bg-white p-2 text-xs font-semibold text-zen-text shadow-subtle hover:bg-surface-soft active:scale-95 transition-all"
          aria-label="Refresh"
        >
          <RefreshCw className="h-4 w-4 text-zen-muted" />
        </button>
      </div>

      {/* Main Listing Header Card */}
      <div className="rounded-3xl border border-zen-border bg-white p-6 sm:p-8 shadow-subtle space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-serif font-bold text-ink">{l.foodName}</h1>
              <StatusBadge status={l.status} size="md" />
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zen-text font-sans">
              {l.description}
            </p>
          </div>
          {cancellable && (
            <button
              onClick={cancelListing}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-all disabled:opacity-50"
            >
              <Ban className="h-4 w-4" aria-hidden />
              <span>Cancel Listing</span>
            </button>
          )}
        </div>

        {/* Quantity Progress */}
        <div className="rounded-2xl border border-zen-border bg-page/40 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-1.5 font-bold text-ink">
              <Utensils className="h-4 w-4 text-primary" aria-hidden />
              <span>{l.availableQuantity} of {l.totalQuantity} {l.unit.toLowerCase()} available</span>
            </span>
            <span className="text-primary font-semibold">{claimedPct}% reserved</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-soft">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${claimedPct}%` }}
            />
          </div>
        </div>

        {/* Details Grid */}
        <dl className="grid gap-4 text-xs font-mono sm:grid-cols-2 pt-2 border-t border-zen-border">
          <div className="flex items-start gap-2.5">
            <Clock3 className="mt-0.5 h-4 w-4 text-primary shrink-0" aria-hidden />
            <div>
              <dt className="font-serif font-bold text-ink text-sm">Pickup Deadline</dt>
              <dd className="mt-1 text-zen-text">
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

          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 text-primary shrink-0" aria-hidden />
            <div>
              <dt className="font-serif font-bold text-ink text-sm">Pickup Service Dock</dt>
              <dd className="mt-1 text-zen-text">{l.pickupAddress}</dd>
              <dd className="mt-0.5 text-zen-muted text-[11px]">
                Coordinates: {l.latitude.toFixed(5)}, {l.longitude.toFixed(5)}
              </dd>
            </div>
          </div>

          <div>
            <dt className="font-serif font-bold text-ink text-sm">Prepared Timestamp</dt>
            <dd className="mt-1 text-zen-text">
              {new Date(l.preparedAt).toLocaleString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </dd>
          </div>

          <div>
            <dt className="font-serif font-bold text-ink text-sm">Available From</dt>
            <dd className="mt-1 text-zen-text">
              {new Date(l.availableFrom).toLocaleString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </dd>
          </div>

          {l.allergenNotes && (
            <div className="sm:col-span-2">
              <dt className="font-serif font-bold text-ink text-sm">Allergen Declarations</dt>
              <dd className="mt-1 text-zen-text font-sans">{l.allergenNotes}</dd>
            </div>
          )}

          {l.packagingType && (
            <div className="sm:col-span-2">
              <dt className="font-serif font-bold text-ink text-sm">Packaging Format</dt>
              <dd className="mt-1 text-zen-text font-sans">{l.packagingType}</dd>
            </div>
          )}

          {l.notes && (
            <div className="sm:col-span-2">
              <dt className="font-serif font-bold text-ink text-sm">Pickup Notes</dt>
              <dd className="mt-1 text-zen-text font-sans">{l.notes}</dd>
            </div>
          )}
        </dl>

        {/* Map */}
        <div className="space-y-2 pt-2">
          <div className="overflow-hidden rounded-2xl border border-zen-border">
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
              height="200px"
              zoom={15}
            />
          </div>
          <a
            href={`https://www.openstreetmap.org/?mlat=${l.latitude}&mlon=${l.longitude}#map=16/${l.latitude}/${l.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:text-ink transition-colors"
          >
            <Navigation className="h-3.5 w-3.5" aria-hidden />
            <span>Open in OpenStreetMap</span>
          </a>
        </div>
      </div>

      {/* Tabs: Claims & Matches */}
      <div className="flex gap-1.5 rounded-xl border border-zen-border bg-white p-1 shadow-subtle w-fit" role="tablist">
        <button
          role="tab"
          aria-selected={tab === "claims"}
          onClick={() => setTab("claims")}
          className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-all ${
            tab === "claims"
              ? "bg-primary text-white shadow-subtle font-semibold"
              : "text-zen-muted hover:text-ink hover:bg-page/50"
          }`}
        >
          Claims ({data.claims.length})
        </button>
        <button
          role="tab"
          aria-selected={tab === "matches"}
          onClick={() => setTab("matches")}
          className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-all ${
            tab === "matches"
              ? "bg-primary text-white shadow-subtle font-semibold"
              : "text-zen-muted hover:text-ink hover:bg-page/50"
          }`}
        >
          Nearby Matches ({data.matches.length})
        </button>
      </div>

      {tab === "claims" ? (
        data.claims.length === 0 ? (
          <div className="rounded-2xl border border-zen-border bg-white p-8 text-center text-xs font-mono text-zen-muted shadow-subtle">
            No claims received yet on this surplus batch.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zen-border bg-white shadow-subtle divide-y divide-zen-border">
            {data.claims.map((claim) => (
              <div key={claim.id} className="flex flex-wrap items-center justify-between gap-4 p-4 hover:bg-page/40 transition-colors">
                <div>
                  <p className="font-serif font-bold text-ink text-sm">
                    {claim.recipientOrg} — {claim.quantity} {l.unit.toLowerCase()}
                  </p>
                  <p className="mt-0.5 text-xs font-mono text-zen-muted">
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
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-all disabled:opacity-50"
                      title="Mark recipient as no-show"
                    >
                      <UserX className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zen-border bg-white shadow-subtle divide-y divide-zen-border">
          {data.matches.length === 0 ? (
            <p className="p-8 text-center text-xs font-mono text-zen-muted">
              No eligible matched recipient pantries found within active radius right now.
            </p>
          ) : (
            data.matches.map((m) => (
              <div key={m.recipientId} className="flex items-center justify-between gap-4 p-4 hover:bg-page/40 transition-colors">
                <div>
                  <p className="font-serif font-bold text-ink text-sm">{m.organisationName}</p>
                  <p className="mt-0.5 text-xs font-mono text-zen-muted">
                    {m.distanceKm} km · Estimated Transit ~{m.etaMinutes} min
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-serif text-lg font-bold text-primary">
                    {m.matchScore}%
                  </p>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-zen-muted">
                    Match Confidence
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
