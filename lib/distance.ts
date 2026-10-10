// ---------------------------------------------------------------------------
// Location utilities — Haversine distance, distance scoring, ETA estimation.
// PRD §20/§29: approximate distance between provider and recipient locations.
// ---------------------------------------------------------------------------

export type LatLng = { latitude: number; longitude: number };

const EARTH_RADIUS_KM = 6371;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Great-circle (haversine) distance between two coordinates in kilometres.
 * Accurate enough for city-scale matching; no external API required.
 */
export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.asin(Math.min(1, Math.sqrt(h)));
  return EARTH_RADIUS_KM * c;
}

/**
 * Distance score per PRD §29:
 *   < 2 km  = 100
 *   2–5 km  = 75
 *   5–10 km = 40
 *   > 10 km = 10
 */
export function distanceScore(distanceKm: number): number {
  if (distanceKm < 2) return 100;
  if (distanceKm < 5) return 75;
  if (distanceKm <= 10) return 40;
  return 10;
}

/**
 * Rough travel-time estimate for an urban/campus context.
 * ~18 km/h average door-to-door speed (walking + waiting + slow traffic).
 */
export function estimateEtaMinutes(distanceKm: number): number {
  return Math.max(5, Math.round((distanceKm / 18) * 60));
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${distanceKm.toFixed(1)} km`;
}
