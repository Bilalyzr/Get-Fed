"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Crosshair, Filter, Loader2, RefreshCw, SearchX } from "lucide-react";
import { FoodCard, type FoodCardData } from "@/components/FoodCard";
import { ClaimModal } from "@/components/ClaimModal";
import { MapViewDynamic } from "@/components/MapView";
import { useToast } from "@/components/Toast";
import { foodCategories } from "@/lib/validators";

// ---------------------------------------------------------------------------
// Recipient discovery (PRD §18/§19): filters, food cards, nearby map.
// ---------------------------------------------------------------------------

const DEFAULT_CENTER = { latitude: 12.9716, longitude: 77.5946 }; // fallback

type Filters = {
  maxDistanceKm: number;
  minQuantity: number;
  category: string;
  withinHours: number;
};

export default function DiscoverFoodPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [items, setItems] = useState<FoodCardData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [claiming, setClaiming] = useState<FoodCardData | null>(null);
  const [filters, setFilters] = useState<Filters>({
    maxDistanceKm: 10,
    minQuantity: 1,
    category: "",
    withinHours: 0,
  });

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      toast("error", "Geolocation is not supported by this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        };
        setCoords(next);
        setLocating(false);
        // Persist for matching & profile (non-critical preference).
        fetch("/api/recipient/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        }).catch(() => undefined);
      },
      () => {
        setLocating(false);
        toast("info", "Location unavailable — showing all active listings.");
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }, [toast]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (coords) {
        params.set("latitude", String(coords.latitude));
        params.set("longitude", String(coords.longitude));
      }
      if (filters.maxDistanceKm > 0 && coords) {
        params.set("maxDistanceKm", String(filters.maxDistanceKm));
      }
      if (filters.minQuantity > 1) {
        params.set("minQuantity", String(filters.minQuantity));
      }
      if (filters.category) params.set("category", filters.category);
      if (filters.withinHours > 0) params.set("withinHours", String(filters.withinHours));
      params.set("sort", coords ? "distance" : "deadline");

      const res = await fetch(`/api/listings?${params.toString()}`);
      const json = await res.json();
      if (json.success) setItems(json.data.items);
    } catch {
      toast("error", "Could not load listings.");
    } finally {
      setLoading(false);
    }
  }, [coords, filters, toast]);

  useEffect(() => {
    locate();
  }, [locate]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 20_000); // near-real-time refresh (PRD §59)
    return () => clearInterval(interval);
  }, [load]);

  const markers = useMemo(
    () =>
      (items ?? [])
        .filter(
          (i) =>
            typeof i.latitude === "number" &&
            typeof i.longitude === "number" &&
            (i.distanceKm == null || i.distanceKm <= filters.maxDistanceKm)
        )
        .map((i) => ({
          id: i.id,
          latitude: i.latitude as number,
          longitude: i.longitude as number,
          label: i.foodName,
          sublabel: `${i.availableQuantity} ${i.unit.toLowerCase()} · ${
            i.distanceKm != null ? `${i.distanceKm} km` : i.pickupAddress
          }`,
        })),
    [items, filters.maxDistanceKm]
  );

  const verified = session?.user?.verificationStatus === "VERIFIED";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">Discover food nearby</h1>
          <p className="text-sm text-stone-500">
            {coords
              ? `Using your location (${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)})`
              : "Enable location for distance-aware results."}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={locate} className="btn-secondary" disabled={locating}>
            {locating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Crosshair className="h-4 w-4" aria-hidden />
            )}
            Locate
          </button>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="btn-secondary"
            aria-expanded={showFilters}
          >
            <Filter className="h-4 w-4" aria-hidden />
            Filters
          </button>
          <button onClick={load} className="btn-secondary" aria-label="Refresh">
            <RefreshCw className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      {!verified && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-600/20" role="status">
          Your organisation is pending verification. You can browse listings, but
          claiming requires admin verification.
        </p>
      )}

      {showFilters && (
        <div className="card grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="f-distance" className="label">
              Max distance: {filters.maxDistanceKm} km
            </label>
            <input
              id="f-distance"
              type="range"
              min={1}
              max={25}
              step={1}
              value={filters.maxDistanceKm}
              onChange={(e) =>
                setFilters((f) => ({ ...f, maxDistanceKm: Number(e.target.value) }))
              }
              className="w-full accent-green-700"
            />
          </div>
          <div>
            <label htmlFor="f-quantity" className="label">
              Min quantity
            </label>
            <input
              id="f-quantity"
              type="number"
              min={1}
              className="input"
              value={filters.minQuantity}
              onChange={(e) =>
                setFilters((f) => ({ ...f, minQuantity: Math.max(1, Number(e.target.value) || 1) }))
              }
            />
          </div>
          <div>
            <label htmlFor="f-category" className="label">
              Food type
            </label>
            <select
              id="f-category"
              className="input"
              value={filters.category}
              onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            >
              <option value="">All types</option>
              {foodCategories.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ").toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-hours" className="label">
              Pickup window
            </label>
            <select
              id="f-hours"
              className="input"
              value={filters.withinHours}
              onChange={(e) =>
                setFilters((f) => ({ ...f, withinHours: Number(e.target.value) }))
              }
            >
              <option value={0}>Any time</option>
              <option value={1}>Within 1 hour</option>
              <option value={2}>Within 2 hours</option>
              <option value={6}>Within 6 hours</option>
              <option value={24}>Within 24 hours</option>
            </select>
          </div>
        </div>
      )}

      {/* Map */}
      <MapViewDynamic
        center={coords ?? DEFAULT_CENTER}
        markers={markers}
        radiusKm={coords ? filters.maxDistanceKm : undefined}
        height="260px"
      />

      {/* Results */}
      {loading && !items ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-64" />
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <SearchX className="h-10 w-10 text-stone-300" aria-hidden />
          <p className="text-sm text-stone-500">
            No active listings match right now. New surplus appears here the
            moment it&apos;s published.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-stone-500" role="status">
            {items.length} active listing{items.length === 1 ? "" : "s"}
            {coords ? ` within ${filters.maxDistanceKm} km` : ""} · sorted by{" "}
            {coords ? "distance" : "pickup deadline"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((food) => (
              <FoodCard
                key={food.id}
                food={food}
                claimDisabled={!verified}
                onClaim={(f) => {
                  if (!verified) {
                    toast(
                      "error",
                      "Your organisation is not verified yet — an administrator must verify you before claiming."
                    );
                    return;
                  }
                  setClaiming(f);
                }}
              />
            ))}
          </div>
        </>
      )}

      {claiming && (
        <ClaimModal
          food={claiming}
          onClose={() => setClaiming(null)}
          onClaimed={(claimId) => {
            setClaiming(null);
            load();
            // Jump straight to the QR for the demo flow (PRD §54).
            window.location.href = `/recipient/qr?claim=${claimId}`;
          }}
        />
      )}
    </div>
  );
}
