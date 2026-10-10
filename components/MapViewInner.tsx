"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapMarker, MapViewProps } from "@/components/MapView";

// ---------------------------------------------------------------------------
// The actual Leaflet map — imported dynamically with ssr:false (see MapView).
// ---------------------------------------------------------------------------

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const greenIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function Recenter({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([latitude, longitude]);
  }, [latitude, longitude, map]);
  return null;
}

export function MapViewInner({
  center,
  markers,
  radiusKm,
  height = "320px",
  zoom = 13,
}: MapViewProps) {
  return (
    <div
      className="overflow-hidden rounded-2xl ring-1 ring-stone-200"
      style={{ height }}
      role="region"
      aria-label="Map of nearby surplus food locations"
    >
      <MapContainer
        center={[center.latitude, center.longitude]}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Recenter latitude={center.latitude} longitude={center.longitude} />
        {radiusKm != null && radiusKm > 0 && (
          <Circle
            center={[center.latitude, center.longitude]}
            radius={radiusKm * 1000}
            pathOptions={{ color: "#16a34a", fillColor: "#16a34a", fillOpacity: 0.06, weight: 1.5 }}
          />
        )}
        {markers.map((m: MapMarker) => (
          <Marker key={m.id} position={[m.latitude, m.longitude]} icon={greenIcon}>
            <Popup>
              <strong>{m.label}</strong>
              {m.sublabel && (
                <>
                  <br />
                  <span>{m.sublabel}</span>
                </>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
