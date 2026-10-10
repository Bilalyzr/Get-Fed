"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dashboard/admin");
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch {
        toast("error", "Could not load admin dashboard.");
      }
    })();
  }, [toast]);

  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="skeleton h-28" />
        ))}
      </div>
    );
  }

  const a = data.analytics;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">Platform overview</h1>
          <p className="text-sm text-stone-500">
            Utilisation, verification queue and impact.
          </p>
        </div>
        <button onClick={() => window.location.reload()} className="btn-secondary">
          <RefreshCw className="h-4 w-4" aria-hidden />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Active providers" value={a.activeProviders} icon={Store} tone="info" />
        <MetricCard
          label="Verified recipients"
          value={a.verifiedRecipients}
          icon={HeartHandshake}
          tone="success"
          hint={`${a.pendingRecipients} pending`}
        />
        <MetricCard label="Total users" value={data.users.length} icon={Users} tone="default" />
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

      <section aria-labelledby="verification-queue-title">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="verification-queue-title" className="text-lg font-bold text-stone-900">
            Verification queue
          </h2>
          <Link
            href="/admin/recipients"
            className="flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-800"
          >
            Manage users
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        {a.pendingRecipients === 0 ? (
          <p className="card p-6 text-center text-sm text-stone-500">
            No recipients waiting for verification.
          </p>
        ) : (
          <Link href="/admin/recipients" className="card block p-4 hover:shadow-md">
            <p className="text-sm font-semibold text-amber-700">
              {a.pendingRecipients} recipient organisation
              {a.pendingRecipients === 1 ? "" : "s"} awaiting verification
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Verify to unlock claiming for these organisations.
            </p>
          </Link>
        )}
      </section>

      <section aria-labelledby="audit-title">
        <h2 id="audit-title" className="mb-3 text-lg font-bold text-stone-900">
          Recent audit trail
        </h2>
        <ul className="card divide-y divide-stone-100" role="list">
          {data.auditLogs.slice(0, 8).map((log) => (
            <li key={log.id} className="flex items-center justify-between gap-3 p-3.5 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-stone-800">
                  {log.action?.replace(/_/g, " ").toLowerCase() ?? "unknown event"}
                </p>
                <p className="text-xs text-stone-400">
                  {log.actor?.name ?? "System"} · {new Date(log.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <StatusBadge status={log.entityType === "User" ? "VERIFIED" : "REQUESTED"} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
