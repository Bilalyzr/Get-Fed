"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ListOrdered,
  Utensils,
  PackageCheck,
  CircleAlert,
  PlusCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useToast } from "@/components/Toast";

type Dashboard = {
  metrics: {
    activeListings: number;
    mealsAvailable: number;
    mealsClaimed: number;
    successfulCollections: number;
    mealsRecovered: number;
    expiredListings: number;
  };
  activeListings: {
    id: string;
    foodName: string;
    status: string;
    totalQuantity: number;
    availableQuantity: number;
    unit: string;
    pickupDeadline: string;
    claimCount: number;
  }[];
  recentClaims: {
    id: string;
    quantity: number;
    status: string;
    foodName: string;
    recipientOrg: string;
    createdAt: string;
    pickupDeadline: string;
    expired: boolean;
  }[];
};

export default function ProviderDashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const load = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setRefreshing(true);
      try {
        const res = await fetch("/api/dashboard/provider");
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch {
        toast("error", "Could not load dashboard.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    load();
    // Near-real-time refresh (PRD §59): poll every 15s.
    const interval = setInterval(() => load(), 15_000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
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
            Provider dashboard
          </h1>
          <p className="text-sm text-stone-500">
            {session?.user?.name ? `Welcome back, ${session.user.name}. ` : ""}
            Here&apos;s your surplus coordination status.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => load(true)}
            className="btn-secondary"
            disabled={refreshing}
            aria-label="Refresh dashboard"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
            Refresh
          </button>
          <Link href="/provider/listings/new" className="btn-primary">
            <PlusCircle className="h-4 w-4" aria-hidden />
            New listing
          </Link>
        </div>
      </div>

      {/* Metrics (PRD §41) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Active listings" value={m?.activeListings ?? 0} icon={ListOrdered} tone="info" />
        <MetricCard label="Meals available" value={m?.mealsAvailable ?? 0} icon={Utensils} tone="default" />
        <MetricCard label="Meals claimed" value={m?.mealsClaimed ?? 0} icon={PackageCheck} tone="warning" />
        <MetricCard label="Successful collections" value={m?.successfulCollections ?? 0} icon={PackageCheck} tone="success" />
        <MetricCard
          label="Meals recovered"
          value={m?.mealsRecovered ?? 0}
          icon={PackageCheck}
          tone="success"
          hint="North-star metric"
        />
        <MetricCard label="Expired food" value={m?.expiredListings ?? 0} icon={CircleAlert} tone="danger" />
      </div>

      {/* Active listings */}
      <section aria-labelledby="active-listings-title">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="active-listings-title" className="text-lg font-bold text-stone-900">
            Active listings
          </h2>
          <Link
            href="/provider/listings"
            className="flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-800"
          >
            View all
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        {!data || data.activeListings.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-stone-500">
              No active listings. Publish surplus food to get started.
            </p>
            <Link href="/provider/listings/new" className="btn-primary mt-4">
              <PlusCircle className="h-4 w-4" aria-hidden />
              Create listing
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.activeListings.map((listing) => (
              <Link
                key={listing.id}
                href={`/provider/listings/${listing.id}`}
                className="card p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-stone-900">{listing.foodName}</h3>
                  <StatusBadge status={listing.status} />
                </div>
                <p className="mt-2 text-sm text-stone-600">
                  {listing.availableQuantity} of {listing.totalQuantity}{" "}
                  {listing.unit.toLowerCase()} available · {listing.claimCount} claim
                  {listing.claimCount === 1 ? "" : "s"}
                </p>
                <p className="mt-2 text-sm">
                  <CountdownTimer deadline={listing.pickupDeadline} />
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent claims */}
      <section aria-labelledby="recent-claims-title">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent-claims-title" className="text-lg font-bold text-stone-900">
            Recent claims
          </h2>
          <Link
            href="/provider/claims"
            className="flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-800"
          >
            Manage claims
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        {!data || data.recentClaims.length === 0 ? (
          <div className="card p-8 text-center text-sm text-stone-500">
            No claims yet. When recipients reserve your food, activity appears here.
          </div>
        ) : (
          <ul className="card divide-y divide-stone-100" role="list">
            {data.recentClaims.map((claim) => (
              <li key={claim.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-stone-900">
                    {claim.recipientOrg} reserved {claim.quantity} ·{" "}
                    {claim.foodName}
                  </p>
                  <p className="mt-0.5 text-xs text-stone-400">
                    {new Date(claim.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <StatusBadge status={claim.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
