"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, useMap, CircleMarker, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { TrackingMapProps } from "@/components/tracking/TrackingMap";

// The inner Leaflet map — imported dynamically with ssr:false by the wrapper.

const RECIPIENT_COLOR = "#306d29";
const DESTINATION_COLOR = "#0d530e";
const ROUTE_COLOR = "#4e8b45";

function FitJourney({
  destination,
  recipient,
  hasRoute,
}: {
  destination: { latitude: number; longitude: number };
  recipient: { latitude: number; longitude: number } | null;
  hasRoute: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    const points: L.LatLngExpression[] = [[destination.latitude, destination.longitude]];
    if (recipient) points.push([recipient.latitude, recipient.longitude]);
    if (points.length === 2 && hasRoute) {
      map.fitBounds(L.latLngBounds(points), { padding: [36, 36] });
    } else {
      map.setView([destination.latitude, destination.longitude], 15);
    }
    // Re-fit only when the journey shape materially changes (recipient
    // crossing in/out), not on every marker tick — avoids jumpiness.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination.latitude, destination.longitude, recipient?.latitude, recipient?.longitude, hasRoute]);
  return null;
}

export function TrackingMapInner({
  destination,
  recipient,
  routeGeometry,
  height = "340px",
  stale,
}: TrackingMapProps) {
  // GeoJSON coords are [lng, lat]; Leaflet wants [lat, lng].
  const routePoints: [number, number][] | null =
    routeGeometry && routeGeometry.length >= 2
      ? routeGeometry.map(([lng, lat]) => [lat, lng])
      : null;

  // Straight guide line when no road route is available (visually dashed so
  // it is never mistaken for a road route — spec §7).
  const guidePoints: [number, number][] | null =
    !routePoints && recipient
      ? [
          [recipient.latitude, recipient.longitude],
          [destination.latitude, destination.longitude],
        ]
      : null;

  const center = recipient ?? destination;

  return (
    <div
      className="overflow-hidden rounded-2xl ring-1 ring-zen-border"
      style={{ height }}
      role="region"
      aria-label="Live pickup tracking map"
    >
      <MapContainer
        center={[center.latitude, center.longitude]}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <FitJourney destination={destination} recipient={recipient} hasRoute={!!routePoints} />

        {routePoints && (
          <Polyline positions={routePoints} pathOptions={{ color: ROUTE_COLOR, weight: 5, opacity: 0.85 }} />
        )}
        {guidePoints && (
          <Polyline
            positions={guidePoints}
            pathOptions={{ color: ROUTE_COLOR, weight: 2, opacity: 0.5, dashArray: "6 8" }}
          />
        )}

        {/* Destination pin */}
        <CircleMarker
          center={[destination.latitude, destination.longitude]}
          radius={10}
          pathOptions={{ color: DESTINATION_COLOR, fillColor: DESTINATION_COLOR, fillOpacity: 0.9 }}
        >
          <Tooltip permanent direction="top" offset={[0, -8]}>
            {destination.label}
          </Tooltip>
        </CircleMarker>

        {/* Live recipient marker (updates in place — map is not recreated) */}
        {recipient && (
          <CircleMarker
            center={[recipient.latitude, recipient.longitude]}
            radius={8}
            pathOptions={{
              color: "#ffffff",
              weight: 2,
              fillColor: stale ? "#93986f" : RECIPIENT_COLOR,
              fillOpacity: 1,
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -6]}>
              {stale ? "Last known location" : "You"}
            </Tooltip>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}
