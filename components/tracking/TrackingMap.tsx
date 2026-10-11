"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// ---------------------------------------------------------------------------
// PickupTrackingMap — Leaflet journey view (spec §13): destination marker,
// live recipient marker, road-route polyline, auto-fit bounds. Loaded with
// ssr:false (Leaflet needs window) and mounted only after hydration.
// ---------------------------------------------------------------------------

export type TrackingMapProps = {
  destination: { latitude: number; longitude: number; label: string };
  recipient: { latitude: number; longitude: number } | null;
  routeGeometry: [number, number][] | null; // [[lng, lat], ...] GeoJSON order
  height?: string;
  stale?: boolean;
};

const TrackingMapInner = dynamic<TrackingMapProps>(
  () => import("@/components/tracking/TrackingMapInner").then((m) => m.TrackingMapInner),
  {
    ssr: false,
    loading: () => <div className="skeleton h-full w-full" aria-label="Loading map" />,
  }
);

export function PickupTrackingMap(props: TrackingMapProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="skeleton" style={{ height: props.height ?? "340px" }} aria-label="Loading map" />
    );
  }
  return <TrackingMapInner {...props} />;
}

export const PickupTrackingStatus = ({ status, stale }: { status: string; stale?: boolean }) => {
  const map: Record<string, { label: string; cls: string }> = {
    ACTIVE: { label: stale ? "Live — location stale" : "Live tracking", cls: "badge-partially_reserved" },
    ARRIVED: { label: "Arrived at pickup", cls: "badge-collected" },
    STOPPED: { label: "Tracking stopped", cls: "badge-expired" },
    COMPLETED: { label: "Completed", cls: "badge-collected" },
    CANCELLED: { label: "Cancelled", cls: "badge-cancelled" },
  };
  const meta = map[status] ?? { label: status, cls: "badge-requested" };
  return <span className={`badge ${meta.cls}`}>{meta.label}</span>;
};
