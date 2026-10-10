"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// ---------------------------------------------------------------------------
// Leaflet + OpenStreetMap view (PRD §20/§46).
// Leaflet requires `window`, so the real map is loaded with next/dynamic
// ssr:false and only mounted on the client after hydration.
// ---------------------------------------------------------------------------

export type MapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  sublabel?: string;
};

export type MapViewProps = {
  center: { latitude: number; longitude: number };
  markers: MapMarker[];
  radiusKm?: number;
  height?: string;
  zoom?: number;
};

const MapViewInner = dynamic<MapViewProps>(
  () => import("@/components/MapViewInner").then((m) => m.MapViewInner),
  {
    ssr: false,
    loading: () => <div className="skeleton h-full w-full" aria-label="Loading map" />,
  }
);

export function MapViewDynamic(props: MapViewProps) {
  // Avoid hydration mismatch: render only after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div
        className="skeleton"
        style={{ height: props.height ?? "320px" }}
        aria-label="Loading map"
      />
    );
  }
  return <MapViewInner {...props} />;
}

// Kept for API compatibility with existing imports.
export const MapView = MapViewDynamic;
