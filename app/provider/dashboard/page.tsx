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
  Clock,
  Sparkles,
  ClipboardList,
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
    const interval = setInterval(() => load(), 15_000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
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
              Provider Dispatch Terminal
            </span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-ink">
            Surplus Overview
          </h1>
          <p className="mt-1 text-sm text-zen-muted">
            {session?.user?.name ? `Welcome back, ${session.user.name}. ` : ""}
            Manage active batches, monitor incoming claims, and track verified impact.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => load(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zen-border bg-white px-3.5 py-2 text-xs font-semibold text-zen-text shadow-subtle hover:bg-surface-soft active:scale-95 transition-all"
            disabled={refreshing}
            aria-label="Refresh dashboard"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-zen-muted ${refreshing ? "animate-spin text-primary" : ""}`} />
            <span>Sync</span>
          </button>
          <Link
            href="/provider/listings/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-soft hover:bg-primary-hover active:scale-95 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Listing</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Active listings" value={m?.activeListings ?? 0} icon={ListOrdered} tone="info" />
        <MetricCard label="Meals available" value={m?.mealsAvailable ?? 0} icon={Utensils} tone="default" />
        <MetricCard label="Meals claimed" value={m?.mealsClaimed ?? 0} icon={PackageCheck} tone="warning" />
        <MetricCard label="Successful collections" value={m?.successfulCollections ?? 0} icon={PackageCheck} tone="success" />
        <MetricCard
          label="Meals recovered"
          value={m?.mealsRecovered ?? 0}
          icon={Sparkles}
          tone="success"
          hint="North-star metric"
        />
        <MetricCard label="Expired listings" value={m?.expiredListings ?? 0} icon={CircleAlert} tone="danger" />
      </div>

      {/* Active Listings Section */}
      <section aria-labelledby="active-listings-title" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="active-listings-title" className="text-xl font-serif font-bold text-ink">
              Live Surplus Batches
            </h2>
            <p className="text-xs font-mono text-zen-muted">
              Batches visible in discovery until their pickup cutoff
            </p>
          </div>
          <Link
            href="/provider/listings"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zen-border bg-white px-3 py-1.5 text-xs font-semibold text-primary hover:bg-surface-soft transition-colors shadow-subtle"
          >
            <span>All listings</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {!data || data.activeListings.length === 0 ? (
          <div className="rounded-3xl border border-zen-border bg-white p-10 text-center shadow-subtle">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-soft text-primary border border-zen-border">
              <Utensils className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-serif text-lg font-bold text-ink">No Active Batches</h3>
            <p className="mt-1 text-xs text-zen-muted max-w-sm mx-auto">
              You haven&apos;t published any surplus batches yet today. Log freshly packaged meals before pickup windows close.
            </p>
            <Link
              href="/provider/listings/new"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white shadow-subtle hover:bg-primary-hover active:scale-95 transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create First Listing</span>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {data.activeListings.map((listing) => (
              <Link
                key={listing.id}
                href={`/provider/listings/${listing.id}`}
                className="group rounded-2xl border border-zen-border bg-white p-5 shadow-subtle hover:border-primary-soft hover:shadow-soft transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-serif text-base font-bold text-ink group-hover:text-primary transition-colors">
                      {listing.foodName}
                    </h3>
                    <p className="mt-1 text-xs font-mono text-zen-muted">
                      {listing.availableQuantity} of {listing.totalQuantity}{" "}
                      {listing.unit.toLowerCase()} available
                    </p>
                  </div>
                  <StatusBadge status={listing.status} />
                </div>

                <div className="mt-4 pt-3 border-t border-zen-border flex items-center justify-between text-xs">
                  <CountdownTimer deadline={listing.pickupDeadline} />
                  <span className="font-mono text-[11px] font-semibold text-primary bg-primary-faint/60 px-2.5 py-0.5 rounded-full">
                    {listing.claimCount} {listing.claimCount === 1 ? "claim" : "claims"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent Claims Section */}
      <section aria-labelledby="recent-claims-title" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="recent-claims-title" className="text-xl font-serif font-bold text-ink">
              Recent Claim Activity
            </h2>
            <p className="text-xs font-mono text-zen-muted">
              Reservations placed by verified recipient organizations
            </p>
          </div>
          <Link
            href="/provider/claims"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zen-border bg-white px-3 py-1.5 text-xs font-semibold text-primary hover:bg-surface-soft transition-colors shadow-subtle"
          >
            <span>Manage claims</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {!data || data.recentClaims.length === 0 ? (
          <div className="rounded-2xl border border-zen-border bg-white p-8 text-center text-xs font-mono text-zen-muted shadow-subtle">
            No claims received yet. When verified pantries reserve meals, requests will appear here with dynamic QR scan triggers.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zen-border bg-white shadow-subtle divide-y divide-zen-border">
            {data.recentClaims.map((claim) => (
              <div key={claim.id} className="flex items-center justify-between gap-4 p-4 hover:bg-page/40 transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-ink text-sm">
                      {claim.recipientOrg}
                    </span>
                    <span className="rounded-full bg-primary-faint px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                      {claim.quantity} portions
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-zen-muted truncate">
                    Batch: {claim.foodName}
                  </p>
                  <p className="mt-1 text-[11px] font-mono text-zen-faint">
                    Claimed{" "}
                    {new Date(claim.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <StatusBadge status={claim.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
