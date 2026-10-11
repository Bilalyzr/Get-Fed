// ---------------------------------------------------------------------------
// Road routing + ETA adapter (tracking spec §7).
//
// Default provider: OSRM (public demo server for development). Configurable
// via ROUTING_PROVIDER_URL (self-hosted OSRM or any OSRM-compatible service).
// Failures return an explicit `available: false` state — never a fake
// straight-line "road" distance.
// ---------------------------------------------------------------------------

export type RoutePoint = { latitude: number; longitude: number };

export type RoadRoute = {
  available: true;
  distanceMeters: number;
  durationSeconds: number;
  /** GeoJSON LineString coordinates: [[lng, lat], ...] */
  geometry: [number, number][];
};

export type UnavailableRoute = { available: false; reason: string };

export type RouteResult = RoadRoute | UnavailableRoute;

const DEFAULT_OSRM_BASE = "https://router.project-osrm.org";
const REQUEST_TIMEOUT_MS = 4000;
const THROTTLE_TTL_MS = 8000; // recalc at most every 8s per origin/dest pair
const THROTTLE_MIN_MOVEMENT_M = 25; // or when origin moved ≥ 25 m

type CacheEntry = { at: number; origin: RoutePoint; result: RouteResult };
const cache = new Map<string, CacheEntry>();

function providerBase(): string {
  return process.env.ROUTING_PROVIDER_URL?.replace(/\/+$/, "") ?? DEFAULT_OSRM_BASE;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function metersBetween(a: RoutePoint, b: RoutePoint): number {
  const R = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function isValidOSRMShape(v: unknown): v is { routes: Array<{ distance: number; duration: number; geometry: { coordinates: [number, number][] } }> } {
  if (!v || typeof v !== "object") return false;
  const routes = (v as { routes?: unknown }).routes;
  if (!Array.isArray(routes) || routes.length === 0) return false;
  const r = routes[0] as Record<string, unknown>;
  return (
    typeof r.distance === "number" &&
    Number.isFinite(r.distance) &&
    typeof r.duration === "number" &&
    Number.isFinite(r.duration) &&
    !!r.geometry &&
    Array.isArray((r.geometry as { coordinates?: unknown }).coordinates) &&
    (r.geometry as { coordinates: unknown[] }).coordinates.length >= 2
  );
}

/**
 * Calculate a driving route between origin and destination.
 * Throttled per claim: repeated calls within the TTL, or calls where the
 * origin has barely moved, return the previous result without a network hit.
 */
export async function calculateRoute(
  cacheKey: string,
  origin: RoutePoint,
  destination: RoutePoint
): Promise<RouteResult> {
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (
    cached &&
    now - cached.at < THROTTLE_TTL_MS &&
    metersBetween(cached.origin, origin) < THROTTLE_MIN_MOVEMENT_M &&
    cached.result.available
  ) {
    return cached.result;
  }

  const url =
    `${providerBase()}/route/v1/driving/` +
    `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}` +
    `?overview=full&geometries=geojson`;

  let result: RouteResult;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res.ok) {
      result = { available: false, reason: `routing_service_http_${res.status}` };
    } else {
      const body: unknown = await res.json();
      if (isValidOSRMShape(body)) {
        const route = body.routes[0];
        result = {
          available: true,
          distanceMeters: Math.round(route.distance),
          durationSeconds: Math.round(route.duration),
          geometry: route.geometry.coordinates,
        };
      } else {
        result = { available: false, reason: "routing_service_invalid_response" };
      }
    }
  } catch (error) {
    const reason =
      error instanceof Error && error.name === "AbortError"
        ? "routing_service_timeout"
        : "routing_service_unreachable";
    result = { available: false, reason };
  }

  // Only positive results are cached; failures retry on the next fix.
  if (result.available) {
    cache.set(cacheKey, { at: now, origin, result });
    // Bound the cache (safety valve for long-running processes).
    if (cache.size > 500) {
      const oldest = cache.keys().next().value;
      if (oldest) cache.delete(oldest);
    }
  }
  return result;
}

/** Straight-line distance in metres — used ONLY for arrival proximity. */
export function distanceMeters(a: RoutePoint, b: RoutePoint): number {
  return metersBetween(a, b);
}
