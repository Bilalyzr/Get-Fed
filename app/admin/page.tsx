"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Store,
  HeartHandshake,
  ListOrdered,
  CircleAlert,
  PackageCheck,
  ClipboardX,
  UserX,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Activity,
  FileBarChart,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";

type AdminData = {
  analytics: {
    activeProviders: number;
    verifiedRecipients: number;
    pendingRecipients: number;
    activeListings: number;
    expiredListings: number;
    mealsRecovered: number;
    collectionRate: number;
    cancelledClaims: number;
    noShowClaims: number;
    noShowRate: number;
  };
  users: {
    id: string;
    name: string;
    email: string;
    role: string;
    organisationName: string;
    verificationStatus: string;
  }[];
  auditLogs: {
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
    actor?: { name: string; role?: string };
  }[];
};

export default function AdminOverviewPage() {
  const { toast } = useToast();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setRefreshing(true);
      try {
        const res = await fetch("/api/dashboard/admin");
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch {
        toast("error", "Could not load admin dashboard.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 20_000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  const a = data.analytics;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zen-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
              Admin Governance & Telemetry
            </span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-ink">
            Platform Command Center
          </h1>
          <p className="mt-1 text-sm text-zen-muted">
            Real-time multi-tenant monitoring, verification queues, and audit streams across all campus dining nodes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zen-border bg-white px-3.5 py-2 text-xs font-semibold text-zen-text shadow-subtle hover:bg-surface-soft active:scale-95 transition-all"
            disabled={refreshing}
            aria-label="Refresh dashboard"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-zen-muted ${refreshing ? "animate-spin text-primary" : ""}`}
            />
            <span>Sync</span>
          </button>
          <Link
            href="/admin/recipients"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-soft hover:bg-primary-hover active:scale-95 transition-all"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Verification Queue</span>
          </Link>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/admin/recipients"
          className="group flex items-center justify-between rounded-2xl border border-zen-border bg-white p-3.5 shadow-subtle hover:border-primary-soft hover:shadow-soft transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-faint text-ink">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="font-serif text-xs font-bold text-ink group-hover:text-primary transition-colors">
                Recipients
              </p>
              <p className="text-[11px] font-mono text-zen-muted">
                {a.pendingRecipients} awaiting approval
              </p>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-zen-muted group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
        </Link>

        <Link
          href="/admin/users"
          className="group flex items-center justify-between rounded-2xl border border-zen-border bg-white p-3.5 shadow-subtle hover:border-primary-soft hover:shadow-soft transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-faint text-ink">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="font-serif text-xs font-bold text-ink group-hover:text-primary transition-colors">
                Directory
              </p>
              <p className="text-[11px] font-mono text-zen-muted">
                {data.users.length} registered
              </p>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-zen-muted group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
        </Link>

        <Link
          href="/admin/listings"
          className="group flex items-center justify-between rounded-2xl border border-zen-border bg-white p-3.5 shadow-subtle hover:border-primary-soft hover:shadow-soft transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-faint text-ink">
              <ListOrdered className="h-4 w-4" />
            </div>
            <div>
              <p className="font-serif text-xs font-bold text-ink group-hover:text-primary transition-colors">
                Listings
              </p>
              <p className="text-[11px] font-mono text-zen-muted">
                {a.activeListings} active batches
              </p>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-zen-muted group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
        </Link>

        <Link
          href="/admin/analytics"
          className="group flex items-center justify-between rounded-2xl border border-zen-border bg-white p-3.5 shadow-subtle hover:border-primary-soft hover:shadow-soft transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-faint text-ink">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <p className="font-serif text-xs font-bold text-ink group-hover:text-primary transition-colors">
                Analytics
              </p>
              <p className="text-[11px] font-mono text-zen-muted">
                Deep impact metrics
              </p>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-zen-muted group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
        </Link>
      </div>

      {/* 9-Metric Command Matrix */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Active providers" value={a.activeProviders} icon={Store} tone="info" />
        <MetricCard
          label="Verified recipients"
          value={a.verifiedRecipients}
          icon={HeartHandshake}
          tone="success"
          hint={`${a.pendingRecipients} pending review`}
        />
        <MetricCard label="Total registered users" value={data.users.length} icon={Users} tone="default" />
        <MetricCard label="Active listings" value={a.activeListings} icon={ListOrdered} tone="info" />
        <MetricCard
          label="Meals recovered"
          value={a.mealsRecovered}
          icon={PackageCheck}
          tone="success"
          hint="North-star metric"
        />
        <MetricCard label="Collection rate" value={`${a.collectionRate}%`} icon={PackageCheck} tone="success" />
        <MetricCard label="Expired listings" value={a.expiredListings} icon={CircleAlert} tone="danger" />
        <MetricCard label="Cancelled claims" value={a.cancelledClaims} icon={ClipboardX} tone="warning" />
        <MetricCard label="No-show rate" value={`${a.noShowRate}%`} icon={UserX} tone="danger" />
      </div>

      {/* Verification Queue Section */}
      <section aria-labelledby="verification-queue-title" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="verification-queue-title" className="text-xl font-serif font-bold text-ink">
              Recipient Verification Queue
            </h2>
            <p className="text-xs font-mono text-zen-muted">
              Campus pantries and verified organisations waiting for claiming authorisation
            </p>
          </div>
          <Link
            href="/admin/recipients"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zen-border bg-white px-3 py-1.5 text-xs font-semibold text-primary hover:bg-surface-soft transition-colors shadow-subtle"
          >
            <span>Review all</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {a.pendingRecipients === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border border-zen-border bg-white p-6 shadow-subtle">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-faint text-ink">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-serif font-bold text-ink text-sm">
                Queue Clear
              </p>
              <p className="text-xs text-zen-muted">
                All recipient organisations are up-to-date and verified for instant claiming.
              </p>
            </div>
          </div>
        ) : (
          <Link
            href="/admin/recipients"
            className="group flex items-center justify-between rounded-2xl border border-amber-300 bg-amber-50/70 p-5 shadow-subtle hover:bg-amber-50 transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <ShieldCheck className="h-5 w-5 text-amber-700 animate-pulse" />
              </div>
              <div>
                <p className="font-serif font-bold text-amber-900 text-base">
                  {a.pendingRecipients} Recipient Organisation{a.pendingRecipients === 1 ? "" : "s"} Awaiting Verification
                </p>
                <p className="mt-0.5 text-xs text-amber-800 font-mono">
                  Action required: Review organization credentials to unlock claiming permissions.
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-subtle group-hover:bg-primary-hover transition-colors">
              <span>Open Queue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        )}
      </section>

      {/* Audit Trail Stream */}
      <section aria-labelledby="audit-title" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="audit-title" className="text-xl font-serif font-bold text-ink">
              Recent Platform Audit Trail
            </h2>
            <p className="text-xs font-mono text-zen-muted">
              Immutable ledger of mutations across surplus listings, claims, and verification state
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zen-border bg-white shadow-subtle divide-y divide-zen-border">
          {data.auditLogs.slice(0, 8).map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between gap-4 p-4 hover:bg-page/40 transition-colors text-sm"
            >
              <div className="min-w-0">
                <p className="font-serif font-bold text-ink">
                  {log.action?.replace(/_/g, " ").toLowerCase() ?? "system event"}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs font-mono text-zen-muted">
                  <span className="font-medium text-ink/80">
                    {log.actor?.name ?? "System Daemon"}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-[11px] text-zen-faint">
                    <Clock className="h-3 w-3" />
                    {new Date(log.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
              <StatusBadge status={log.entityType === "User" ? "VERIFIED" : "COLLECTED"} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
