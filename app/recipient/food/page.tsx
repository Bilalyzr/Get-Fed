"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Crosshair, Filter, Loader2, RefreshCw, SearchX } from "lucide-react";
import { FoodCard, type FoodCardData } from "@/components/FoodCard";
import { ClaimModal } from "@/components/ClaimModal";
import { MapViewDynamic } from "@/components/MapView";
import { useToast } from "@/components/Toast";
import { foodCategories } from "@/lib/validators";

const DEFAULT_CENTER = { latitude: 12.9716, longitude: 77.5946 };

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
  const [refreshing, setRefreshing] = useState(false);
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
        fetch("/api/recipient/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        }).catch(() => undefined);
      },
      () => {
        setLocating(false);
        toast("info", "Location unavailable — showing all active campus listings.");
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }, [toast]);

  const load = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setRefreshing(true);
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
        setRefreshing(false);
      }
    },
    [coords, filters, toast]
  );

  useEffect(() => {
    locate();
  }, [locate]);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(), 20_000);
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zen-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
              Surplus Discovery Grid
            </span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-ink">
            Discover Food
          </h1>
          <p className="mt-1 text-sm text-zen-muted">
            {coords
              ? `Filtered by proximity to your coordinates (${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)})`
              : "Active campus batches ready for immediate reservation and pickup."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={locate}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zen-border bg-white px-3.5 py-2 text-xs font-semibold text-zen-text shadow-subtle hover:bg-surface-soft active:scale-95 transition-all"
            disabled={locating}
          >
            {locating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden />
            ) : (
              <Crosshair className="h-3.5 w-3.5 text-primary" aria-hidden />
            )}
            <span>Locate</span>
          </button>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-subtle transition-all ${
              showFilters
                ? "border-primary bg-primary text-white"
                : "border-zen-border bg-white text-zen-text hover:bg-surface-soft"
            }`}
            aria-expanded={showFilters}
          >
            <Filter className="h-3.5 w-3.5" aria-hidden />
            <span>Filters</span>
          </button>
          <button
            onClick={() => load(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zen-border bg-white p-2 text-zen-text shadow-subtle hover:bg-surface-soft active:scale-95 transition-all"
            aria-label="Refresh listings"
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 text-zen-muted ${refreshing ? "animate-spin text-primary" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Filter drawer */}
      {showFilters && (
        <div className="rounded-2xl border border-zen-border bg-white p-5 shadow-subtle grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="f-distance" className="block text-xs font-serif font-bold text-ink mb-1.5">
              Max Distance: {filters.maxDistanceKm} km
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
              className="w-full accent-primary"
            />
          </div>
          <div>
            <label htmlFor="f-quantity" className="block text-xs font-serif font-bold text-ink mb-1.5">
              Min Quantity
            </label>
            <input
              id="f-quantity"
              type="number"
              min={1}
              className="w-full rounded-xl border border-zen-border bg-page/40 px-3 py-1.5 text-xs font-mono text-zen-text focus:border-primary focus:outline-none"
              value={filters.minQuantity}
              onChange={(e) =>
                setFilters((f) => ({ ...f, minQuantity: Math.max(1, Number(e.target.value) || 1) }))
              }
            />
          </div>
          <div>
            <label htmlFor="f-category" className="block text-xs font-serif font-bold text-ink mb-1.5">
              Category
            </label>
            <select
              id="f-category"
              className="w-full rounded-xl border border-zen-border bg-page/40 px-3 py-1.5 text-xs font-mono text-zen-text focus:border-primary focus:outline-none capitalize"
              value={filters.category}
              onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            >
              <option value="">All Categories</option>
              {foodCategories.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ").toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-hours" className="block text-xs font-serif font-bold text-ink mb-1.5">
              Pickup Window
            </label>
            <select
              id="f-hours"
              className="w-full rounded-xl border border-zen-border bg-page/40 px-3 py-1.5 text-xs font-mono text-zen-text focus:border-primary focus:outline-none"
              value={filters.withinHours}
              onChange={(e) =>
                setFilters((f) => ({ ...f, withinHours: Number(e.target.value) }))
              }
            >
              <option value={0}>Any Window</option>
              <option value={1}>Within 1 hour</option>
              <option value={2}>Within 2 hours</option>
              <option value={6}>Within 6 hours</option>
              <option value={24}>Within 24 hours</option>
            </select>
          </div>
        </div>
      )}

      {/* Campus Map View */}
      <div className="overflow-hidden rounded-2xl border border-zen-border bg-white shadow-subtle">
        <MapViewDynamic
          center={coords ?? DEFAULT_CENTER}
          markers={markers}
          radiusKm={coords ? filters.maxDistanceKm : undefined}
          height="240px"
        />
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-zen-muted" role="status">
          {items ? items.length : 0} active listing{items?.length === 1 ? "" : "s"}
          {coords ? ` within ${filters.maxDistanceKm} km` : ""} · sorted by{" "}
          {coords ? "distance" : "pickup deadline"}
        </p>
      </div>

      {/* Results Grid */}
      {loading && !items ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <div className="rounded-3xl border border-zen-border bg-white p-12 text-center shadow-subtle">
          <SearchX className="mx-auto h-12 w-12 text-zen-muted/60" />
          <h3 className="mt-4 font-serif text-lg font-bold text-ink">No Surplus Matching Filter</h3>
          <p className="mt-1 text-xs text-zen-muted max-w-sm mx-auto">
            Try expanding your distance slider or resetting category filters to see all available dining batches.
          </p>
        </div>
      ) : (
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
                    "Your organisation is pending verification. Claims unlock immediately after admin approval."
                  );
                  return;
                }
                setClaiming(f);
              }}
            />
          ))}
        </div>
      )}

      {claiming && (
        <ClaimModal
          food={claiming}
          onClose={() => setClaiming(null)}
          onClaimed={(claimId) => {
            setClaiming(null);
            load();
            window.location.href = `/recipient/qr?claim=${claimId}`;
          }}
        />
      )}
    </div>
  );
}
