"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  MapPin,
  Navigation,
  QrCode,
  Play,
  Square,
  AlertTriangle,
  LocateFixed,
  Clock3,
  Route as RouteIcon,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { PickupTrackingMap, PickupTrackingStatus } from "@/components/tracking/TrackingMap";
import { CountdownTimer } from "@/components/CountdownTimer";
import { BackButton } from "@/components/BackButton";
import { usePickupTracking } from "@/hooks/usePickupTracking";
import { useToast } from "@/components/Toast";

// ---------------------------------------------------------------------------
// Recipient live pickup screen (spec §12).
// ---------------------------------------------------------------------------

type TrackingState = {
  claim: { id: string; quantity: number; foodName: string; unit: string; status: string };
  destination: { latitude: number; longitude: number; address: string };
  pickupDeadline: string;
  tracking: {
    status: string;
    lastLocationAt: string | null;
    accuracyMeters: number | null;
    recipientLocation: { latitude: number; longitude: number } | null;
    route: { available: boolean; distanceMeters?: number | null; durationSeconds?: number | null; geometry?: unknown };
    arrivalDetectedAt: string | null;
    delayLikely: boolean;
    stale: boolean;
  } | null;
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}

export default function RecipientTrackingPage() {
  const params = useParams<{ claimId: string }>();
  const { toast } = useToast();
  const [data, setData] = useState<TrackingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { state, start, stop } = usePickupTracking(params.claimId);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/claims/${params.claimId}/tracking`);
      if (res.status === 404 || res.status === 403) {
        setNotFound(true);
        return;
      }
      const json = await res.json();
      if (json.success && json.data?.claim) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, [params.claimId]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll for route/arrival updates while sharing (spec §2: 5s).
  useEffect(() => {
    if (!state.sharing) return;
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [state.sharing, load]);

  async function handleStart() {
    const ok = await start();
    if (!ok) {
      toast("error", "Could not start tracking — the claim may no longer be eligible.");
      return;
    }
    toast("success", "Live tracking started.");
    load();
  }

  async function handleStop() {
    await stop();
    toast("info", "Sharing stopped and your location was cleared.");
    load();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-96" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="mx-auto max-w-2xl">
        <BackButton fallbackHref="/recipient/claims" label="Back to my claims" />
        <div className="card mt-4 p-10 text-center text-sm text-zen-muted">
          This claim cannot be tracked.{" "}
          <Link href="/recipient/claims" className="font-semibold text-primary">
            Back to my claims
          </Link>
        </div>
      </div>
    );
  }

  const t = data.tracking;
  const routeAvailable = t?.route?.available === true;
  const etaSeconds = routeAvailable ? (t!.route.durationSeconds ?? 0) : null;
  const distanceMeters = routeAvailable ? (t!.route.distanceMeters ?? 0) : null;
  const directionsUrl = `https://www.openstreetmap.org/directions?to=${data.destination.latitude},${data.destination.longitude}`;
  const canTrack = ["RESERVED", "PICKUP_IN_PROGRESS"].includes(data.claim.status);
  const arrived = t?.status === "ARRIVED" || !!t?.arrivalDetectedAt;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackButton fallbackHref="/recipient/claims" label="Back to my claims" />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Live pickup</h1>
          <p className="mt-0.5 text-sm text-zen-muted">
            {data.claim.foodName} · {data.claim.quantity} {data.claim.unit.toLowerCase()}
          </p>
        </div>
        {t && <PickupTrackingStatus status={t.status} stale={t.stale} />}
      </div>

      {/* Delay warning */}
      {t?.delayLikely && !arrived && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-4 text-sm text-amber-900 shadow-subtle"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
          <div>
            <strong className="font-semibold">You might miss the deadline</strong>
            <p className="mt-0.5 text-xs">
              Your ETA plus the safety buffer exceeds the pickup deadline. Hurry, or cancel the
              claim so the food returns to available.
            </p>
          </div>
        </div>
      )}

      {/* Arrival banner */}
      {arrived && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-primary-soft bg-primary-wash/60 p-4 text-sm text-primary-hover shadow-subtle"
        >
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="flex-1">
            <strong className="font-semibold">Arrival confirmed</strong>
            <p className="mt-0.5 text-xs">
              The provider has been notified. Show your QR code to complete collection.
            </p>
            <Link href={`/recipient/qr?claim=${data.claim.id}`} className="btn-primary mt-3 !px-4 !py-2 text-xs">
              <QrCode className="h-4 w-4" aria-hidden />
              Show my QR
            </Link>
          </div>
        </div>
      )}

      {/* Map */}
      <PickupTrackingMap
        destination={{ ...data.destination, label: "Pickup point" }}
        recipient={t?.recipientLocation ?? null}
        routeGeometry={(t?.route?.geometry as [number, number][] | undefined) ?? null}
        height="320px"
        stale={t?.stale}
      />

      {/* Journey stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zen-faint">ETA</p>
          <p className="mt-1 flex items-center gap-1.5 text-lg font-bold tabular-nums text-ink">
            <Clock3 className="h-4 w-4 text-primary" aria-hidden />
            {etaSeconds != null ? formatDuration(etaSeconds) : "—"}
          </p>
          {!routeAvailable && <p className="mt-0.5 text-[10px] text-zen-faint">routing unavailable</p>}
        </div>
        <div className="card p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zen-faint">Road distance</p>
          <p className="mt-1 flex items-center gap-1.5 text-lg font-bold tabular-nums text-ink">
            <RouteIcon className="h-4 w-4 text-primary" aria-hidden />
            {distanceMeters != null ? `${(distanceMeters / 1000).toFixed(1)} km` : "—"}
          </p>
        </div>
        <div className="card p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zen-faint">Deadline</p>
          <p className="mt-1 text-sm font-semibold">
            <CountdownTimer deadline={data.pickupDeadline} />
          </p>
        </div>
        <div className="card p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zen-faint">Last update</p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {t?.lastLocationAt
              ? new Date(t.lastLocationAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })
              : "—"}
          </p>
          {t?.accuracyMeters != null && (
            <p className="mt-0.5 text-[10px] text-zen-faint">±{Math.round(t.accuracyMeters)} m GPS</p>
          )}
        </div>
      </div>

      {/* Address + navigation */}
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="flex min-w-0 items-center gap-2 text-sm text-zen-text">
          <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span className="truncate">{data.destination.address}</span>
        </p>
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary !px-3 !py-2 text-xs">
          <Navigation className="h-4 w-4" aria-hidden />
          Navigate
        </a>
      </div>

      {/* Consent controls */}
      {canTrack ? (
        <div className="card space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  state.sharing ? "bg-primary-wash text-primary" : "bg-surface-soft text-zen-muted"
                }`}
                aria-hidden
              >
                <LocateFixed className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">
                  {state.sharing ? "Sharing live location" : "Location sharing off"}
                </p>
                <p className="text-xs text-zen-muted">
                  {state.sharing
                    ? "Only the provider of this listing can see your position."
                    : "Explicitly start sharing so the provider can follow your journey."}
                </p>
              </div>
            </div>
            {state.sharing ? (
              <button onClick={handleStop} className="btn-danger !px-4 !py-2 text-xs">
                <Square className="h-3.5 w-3.5" aria-hidden />
                Stop sharing
              </button>
            ) : (
              <button onClick={handleStart} className="btn-primary !px-4 !py-2 text-xs">
                <Play className="h-3.5 w-3.5" aria-hidden />
                Start sharing
              </button>
            )}
          </div>

          {state.permission === "denied" && (
            <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-200">
              Location permission denied. You can still navigate to the pickup point and use your
              QR code — live tracking just stays off. Enable location for this site in your browser
              settings to use it.
            </p>
          )}
          {state.permission === "unavailable" && (
            <p role="status" className="rounded-lg bg-surface-soft p-3 text-xs text-zen-muted">
              Your browser does not support live location. Navigation and QR pickup still work.
            </p>
          )}
          {state.lastError && (
            <p role="status" className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-amber-200">
              {state.lastError}
            </p>
          )}
          {state.sharing && !state.lastSubmittedAt && (
            <p className="flex items-center gap-2 text-xs text-zen-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Waiting for the first GPS fix…
            </p>
          )}
        </div>
      ) : (
        <p className="card p-4 text-center text-sm text-zen-muted">
          This claim is no longer eligible for live tracking.
        </p>
      )}

      <p className="text-center text-xs text-zen-faint">
        Live sharing works while this screen is open and ends automatically at collection,
        cancellation or deadline. Your location is deleted when sharing stops.
      </p>
    </div>
  );
}
