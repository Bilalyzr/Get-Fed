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
  QrCode,
  Sparkles,
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
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  const m = data?.metrics;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zen-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
              Recipient Allocation Terminal
            </span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-ink">
            Rescue Hub
          </h1>
          <p className="mt-1 text-sm text-zen-muted">
            {session?.user?.name ? `Welcome, ${session.user.name}. ` : ""}
            Real-time surplus food within your campus perimeter ready for collection.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={load}
            className="inline-flex items-center justify-center rounded-xl border border-zen-border bg-white p-2.5 text-zen-text shadow-subtle hover:bg-surface-soft active:scale-95 transition-all"
            aria-label="Refresh dashboard"
          >
            <RefreshCw className="h-4 w-4 text-zen-muted" />
          </button>
          <Link
            href="/recipient/food"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-soft hover:bg-primary-hover active:scale-95 transition-all"
          >
            <ShoppingBasket className="h-4 w-4" />
            <span>Discover Food</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Active claims" value={m?.activeClaims ?? 0} icon={ClipboardList} tone="info" />
        <MetricCard label="Upcoming deadlines" value={m?.upcomingDeadlines ?? 0} icon={Clock3} tone="warning" />
        <MetricCard label="Meals collected" value={m?.mealsCollected ?? 0} icon={PackageCheck} tone="success" />
        <MetricCard label="Past collections" value={m?.pastCollections ?? 0} icon={Sparkles} tone="success" />
      </div>

      {/* Active Claims with Live QR Access */}
      <section aria-labelledby="active-claims-title" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="active-claims-title" className="text-xl font-serif font-bold text-ink">
              Your Reserved Claims
            </h2>
            <p className="text-xs font-mono text-zen-muted">
              Present your QR token at the kitchen service dock to complete pickup
            </p>
          </div>
          <Link
            href="/recipient/claims"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zen-border bg-white px-3 py-1.5 text-xs font-semibold text-primary hover:bg-surface-soft transition-colors shadow-subtle"
          >
            <span>All claims</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {!data || data.activeClaims.length === 0 ? (
          <div className="rounded-2xl border border-zen-border bg-white p-8 text-center text-xs font-mono text-zen-muted shadow-subtle">
            No active claims. Browse surplus listings below to reserve meals for your community.
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2" role="list">
            {data.activeClaims.map((claim) => (
              <li
                key={claim.id}
                className="group rounded-2xl border border-zen-border bg-white p-5 shadow-subtle hover:border-primary-soft hover:shadow-soft transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-serif text-base font-bold text-ink">
                      {claim.foodName}
                    </h3>
                    <p className="mt-0.5 text-xs font-mono text-primary font-bold">
                      {claim.quantity} {claim.unit.toLowerCase()} reserved
                    </p>
                  </div>
                  <StatusBadge status={claim.status} />
                </div>

                <p className="mt-3 flex items-center gap-1.5 text-xs text-zen-muted">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  <span className="truncate">{claim.pickupAddress}</span>
                </p>

                <div className="mt-4 pt-3 border-t border-zen-border flex items-center justify-between gap-2">
                  <CountdownTimer deadline={claim.pickupDeadline} />
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://www.openstreetmap.org/directions?to=${claim.latitude},${claim.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-zen-border bg-page px-2.5 py-1.5 text-xs font-semibold text-zen-text hover:bg-surface-soft transition-all"
                    >
                      <Navigation className="h-3 w-3 text-primary" />
                      <span>Map</span>
                    </a>
                    <Link
                      href={`/recipient/qr?claim=${claim.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-subtle hover:bg-primary-hover active:scale-95 transition-all"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      <span>Show QR</span>
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Available Food Nearby Section */}
      <section aria-labelledby="nearby-title" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="nearby-title" className="text-xl font-serif font-bold text-ink">
              Available Near You
            </h2>
            <p className="text-xs font-mono text-zen-muted">
              Live listings scored by proximity and pickup feasibility
            </p>
          </div>
          <Link
            href="/recipient/food"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zen-border bg-white px-3 py-1.5 text-xs font-semibold text-primary hover:bg-surface-soft transition-colors shadow-subtle"
          >
            <span>Explore all</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {nearby.length === 0 ? (
          <div className="rounded-3xl border border-zen-border bg-white p-10 text-center shadow-subtle">
            <ShoppingBasket className="mx-auto h-12 w-12 text-zen-muted/60" />
            <h3 className="mt-3 font-serif text-base font-bold text-ink">No Active Batches Right Now</h3>
            <p className="mt-1 text-xs text-zen-muted">
              All active campus batches have been claimed. Check back shortly as dining services conclude.
            </p>
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

      {/* Past Collections Summary */}
      {data && data.pastCollections.length > 0 && (
        <section aria-labelledby="past-title" className="space-y-4">
          <h2 id="past-title" className="text-xl font-serif font-bold text-ink">
            Completed Rescues
          </h2>
          <div className="overflow-hidden rounded-2xl border border-zen-border bg-white shadow-subtle divide-y divide-zen-border">
            {data.pastCollections.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-4 hover:bg-page/30 transition-colors text-sm">
                <span className="font-serif font-bold text-ink">
                  {c.foodName} <span className="font-mono text-primary font-normal">({c.quantity} {c.unit.toLowerCase()})</span>
                </span>
                <span className="text-xs font-mono text-zen-muted">
                  Collected {new Date(c.collectedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            ))}
          </div>
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
