"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  MapPin,
  Clock3,
  Route as RouteIcon,
  ScanLine,
  AlertTriangle,
  Radio,
  RadioTower,
  UserRound,
} from "lucide-react";
import { PickupTrackingMap, PickupTrackingStatus } from "@/components/tracking/TrackingMap";
import { CountdownTimer } from "@/components/CountdownTimer";
import { BackButton } from "@/components/BackButton";

// ---------------------------------------------------------------------------
// Provider tracking screen (spec §11) — polls the authorised session every
// 5s while active, shows the recipient's journey, ETA, alerts and QR link.
// ---------------------------------------------------------------------------

type TrackingState = {
  claim: { id: string; quantity: number; foodName: string; unit: string; status: string };
  destination: { latitude: number; longitude: number; address: string };
  pickupDeadline: string;
  tracking: {
    status: string;
    startedAt: string;
    stoppedAt: string | null;
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

export default function ProviderTrackingPage() {
  const params = useParams<{ claimId: string }>();
  const [data, setData] = useState<TrackingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Poll while an active journey exists; stop when tracking ends (spec §11).
  useEffect(() => {
    const status = data?.tracking?.status;
    const active = status === "ACTIVE" || status === "ARRIVED";
    if (active && !pollRef.current) {
      pollRef.current = setInterval(load, 5000);
    } else if (!active && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [data?.tracking?.status, load]);

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
        <BackButton fallbackHref="/provider/claims" label="Back to claims" />
        <div className="card mt-4 p-10 text-center text-sm text-zen-muted">
          Tracking not available for this claim.{" "}
          <Link href="/provider/claims" className="font-semibold text-primary">
            Back to claims
          </Link>
        </div>
      </div>
    );
  }

  const t = data.tracking;
  const routeAvailable = t?.route?.available === true;
  const etaSeconds = routeAvailable ? (t!.route.durationSeconds ?? 0) : null;
  const distanceMeters = routeAvailable ? (t!.route.distanceMeters ?? 0) : null;
  const arrived = t?.status === "ARRIVED" || !!t?.arrivalDetectedAt;
  const live = t?.status === "ACTIVE" || t?.status === "ARRIVED";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackButton fallbackHref="/provider/claims" label="Back to claims" />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Pickup journey</h1>
          <p className="mt-0.5 text-sm text-zen-muted">
            {data.claim.foodName} · {data.claim.quantity} {data.claim.unit.toLowerCase()} ·{" "}
            <span className="font-mono text-xs">claim {data.claim.id.slice(-8)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {live && !t?.stale && (
            <span className="badge badge-partially_reserved">
              <Radio className="h-3.5 w-3.5 animate-pulse" aria-hidden />
              Live
            </span>
          )}
          {t && <PickupTrackingStatus status={t.status} stale={t.stale} />}
        </div>
      </div>

      {/* Alerts */}
      {arrived && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-primary-soft bg-primary-wash/60 p-4 text-sm text-primary-hover shadow-subtle">
          <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="flex-1">
            <strong className="font-semibold">Recipient has arrived</strong>
            <p className="mt-0.5 text-xs">Verify collection by scanning their QR code.</p>
          </div>
          <Link href="/provider/scanner" className="btn-primary !px-4 !py-2 text-xs">
            <ScanLine className="h-4 w-4" aria-hidden />
            Open scanner
          </Link>
        </div>
      )}
      {t?.delayLikely && !arrived && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-4 text-sm text-amber-900 shadow-subtle">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
          <div>
            <strong className="font-semibold">May miss the deadline</strong>
            <p className="mt-0.5 text-xs">
              The recipient&apos;s ETA plus buffer exceeds the pickup deadline.
            </p>
          </div>
        </div>
      )}
      {t?.stale && live && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-zen-border bg-surface-soft/70 p-4 text-sm text-zen-text shadow-subtle">
          <RadioTower className="mt-0.5 h-5 w-5 shrink-0 text-zen-muted" aria-hidden />
          <div>
            <strong className="font-semibold">Live location lost</strong>
            <p className="mt-0.5 text-xs">
              No update for over 30 seconds — the recipient&apos;s device may have suspended sharing.
            </p>
          </div>
        </div>
      )}
      {!t && (
        <p className="card p-4 text-center text-sm text-zen-muted">
          The recipient has not started live tracking for this claim yet.
        </p>
      )}

      {/* Map */}
      <PickupTrackingMap
        destination={{ ...data.destination, label: "Your pickup point" }}
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

      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="flex min-w-0 items-center gap-2 text-sm text-zen-text">
          <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span className="truncate">{data.destination.address}</span>
        </p>
        <Link href="/provider/scanner" className="btn-primary !px-4 !py-2 text-xs">
          <ScanLine className="h-4 w-4" aria-hidden />
          QR scanner
        </Link>
      </div>

      <p className="text-center text-xs text-zen-faint">
        You only see this recipient&apos;s position during an authorised active pickup for your
        listing. Location data is deleted when sharing stops.
      </p>
    </div>
  );
}
