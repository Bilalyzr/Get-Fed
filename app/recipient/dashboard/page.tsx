"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ShoppingBasket,
  ClipboardList,
  PackageCheck,
  Clock3,
  ArrowRight,
  RefreshCw,
  MapPin,
  Navigation,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { CountdownTimer } from "@/components/CountdownTimer";
import { FoodCard, type FoodCardData } from "@/components/FoodCard";
import { ClaimModal } from "@/components/ClaimModal";
import { useToast } from "@/components/Toast";

type Dashboard = {
  metrics: {
    activeClaims: number;
    upcomingDeadlines: number;
    mealsCollected: number;
    pastCollections: number;
  };
  activeClaims: {
    id: string;
    quantity: number;
    status: string;
    foodName: string;
    unit: string;
    pickupDeadline: string;
    pickupAddress: string;
    latitude: number;
    longitude: number;
  }[];
  pastCollections: {
    id: string;
    quantity: number;
    foodName: string;
    unit: string;
    collectedAt: string;
  }[];
};

export default function RecipientDashboardPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [data, setData] = useState<Dashboard | null>(null);
  const [nearby, setNearby] = useState<FoodCardData[]>([]);
  const [claiming, setClaiming] = useState<FoodCardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [dashRes, foodRes] = await Promise.all([
        fetch("/api/dashboard/recipient"),
        fetch("/api/listings?sort=deadline&pageSize=3"),
      ]);
      const dashJson = await dashRes.json();
      const foodJson = await foodRes.json();
      if (dashJson.success) setData(dashJson.data);
      if (foodJson.success) setNearby(foodJson.data.items);
    } catch {
      toast("error", "Could not load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15_000);
    return () => clearInterval(interval);
  }, [load]);

  const verified = session?.user?.verificationStatus === "VERIFIED";

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-28" />
        ))}
      </div>
    );
  }

  const m = data?.metrics;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">
            Recipient dashboard
          </h1>
          <p className="text-sm text-stone-500">
            {session?.user?.name ? `Welcome, ${session.user.name}. ` : ""}
            Live surplus near you, reservations and pickups.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary" aria-label="Refresh">
            <RefreshCw className="h-4 w-4" aria-hidden />
          </button>
          <Link href="/recipient/food" className="btn-primary">
            <ShoppingBasket className="h-4 w-4" aria-hidden />
            Discover food
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Active claims" value={m?.activeClaims ?? 0} icon={ClipboardList} tone="info" />
        <MetricCard label="Upcoming deadlines" value={m?.upcomingDeadlines ?? 0} icon={Clock3} tone="warning" />
        <MetricCard label="Meals collected" value={m?.mealsCollected ?? 0} icon={PackageCheck} tone="success" />
        <MetricCard label="Past collections" value={m?.pastCollections ?? 0} icon={PackageCheck} tone="success" />
      </div>

      {/* Active claims with countdowns (PRD §42) */}
      <section aria-labelledby="active-claims-title">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="active-claims-title" className="text-lg font-bold text-stone-900">
            Active claims
          </h2>
          <Link
            href="/recipient/claims"
            className="flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-800"
          >
            Manage claims
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        {!data || data.activeClaims.length === 0 ? (
          <div className="card p-8 text-center text-sm text-stone-500">
            No active claims. Discover nearby food to reserve a pickup.
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2" role="list">
            {data.activeClaims.map((claim) => (
              <li key={claim.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-stone-900">{claim.foodName}</h3>
                    <p className="mt-0.5 text-sm text-stone-600">
                      {claim.quantity} {claim.unit.toLowerCase()} reserved
                    </p>
                  </div>
                  <StatusBadge status={claim.status} />
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {claim.pickupAddress}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <CountdownTimer deadline={claim.pickupDeadline} />
                  <div className="flex gap-2">
                    <a
                      href={`https://www.openstreetmap.org/directions?to=${claim.latitude},${claim.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost !px-2 !py-1 text-xs"
                    >
                      <Navigation className="h-3.5 w-3.5" aria-hidden />
                      Directions
                    </a>
                    <Link href={`/recipient/qr?claim=${claim.id}`} className="btn-primary !px-3 !py-1.5 text-xs">
                      Show QR
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Nearby food (PRD §42) */}
      <section aria-labelledby="nearby-title">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="nearby-title" className="text-lg font-bold text-stone-900">
            Food nearby
          </h2>
          <Link
            href="/recipient/food"
            className="flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-800"
          >
            View all
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        {nearby.length === 0 ? (
          <div className="card p-8 text-center text-sm text-stone-500">
            No active listings right now — check back soon.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nearby.map((food) => (
              <FoodCard
                key={food.id}
                food={food}
                claimDisabled={!verified}
                onClaim={(f) => {
                  if (!verified) {
                    toast("error", "Your organisation is not verified yet.");
                    return;
                  }
                  setClaiming(f);
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Past collections */}
      {data && data.pastCollections.length > 0 && (
        <section aria-labelledby="past-title">
          <h2 id="past-title" className="mb-3 text-lg font-bold text-stone-900">
            Recent collections
          </h2>
          <ul className="card divide-y divide-stone-100" role="list">
            {data.pastCollections.map((c) => (
              <li key={c.id} className="flex items-center justify-between p-4 text-sm">
                <span className="font-medium text-stone-800">
                  {c.foodName} — {c.quantity} {c.unit.toLowerCase()}
                </span>
                <span className="text-xs text-stone-400">
                  {new Date(c.collectedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </section>
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
