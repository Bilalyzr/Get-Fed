"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import {
  PackageCheck,
  Activity,
  CircleAlert,
  Percent,
  RefreshCw,
  ArrowLeft,
  Clock,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { useToast } from "@/components/Toast";

type Analytics = {
  mealsRecovered: number;
  collectionRate: number;
  claimConversionRate: number;
  expiryRate: number;
  noShowRate: number;
  averageTimeToFirstClaimMinutes: number | null;
  totalListings: number;
  expiredListings: number;
  mealsRecoveredTrend: { date: string; meals: number }[];
  statusBreakdown: { status: string; count: number }[];
};

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "#306d29",
  PARTIALLY_RESERVED: "#4e8b45",
  FULLY_RESERVED: "#d97706",
  PICKUP_IN_PROGRESS: "#0284c7",
  COLLECTED: "#0d530e",
  EXPIRED: "#78716c",
  CANCELLED: "#e11d48",
  DRAFT: "#a8a29e",
};

export default function AdminAnalyticsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<Analytics | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData(showSpinner = false) {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/analytics");
      const json = await res.json();
      if (json.success) setData(json.data.analytics);
    } catch {
      toast("error", "Could not load platform analytics.");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  const barData = data.statusBreakdown.map((s) => ({
    status: s.status.replace(/_/g, " ").toLowerCase(),
    count: s.count,
    color: STATUS_COLORS[s.status] ?? "#306d29",
  }));

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zen-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-xs font-mono text-zen-muted hover:text-ink transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Back to Command Center</span>
            </Link>
          </div>
          <h1 className="text-3xl font-serif font-bold text-ink">
            Platform Impact Analytics
          </h1>
          <p className="mt-1 text-sm text-zen-muted">
            Telemetry metrics tracking campus food rescue velocity, conversion funnels, and perishability mitigation.
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zen-border bg-white px-3.5 py-2 text-xs font-semibold text-zen-text shadow-subtle hover:bg-surface-soft active:scale-95 transition-all"
          disabled={refreshing}
          aria-label="Refresh analytics"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 text-zen-muted ${refreshing ? "animate-spin text-primary" : ""}`}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Meals recovered"
          value={data.mealsRecovered}
          icon={PackageCheck}
          tone="success"
          hint="North-star metric"
        />
        <MetricCard
          label="Collection success rate"
          value={`${data.collectionRate}%`}
          icon={Activity}
          tone="success"
        />
        <MetricCard
          label="Claim conversion rate"
          value={`${data.claimConversionRate}%`}
          icon={Percent}
          tone="info"
        />
        <MetricCard
          label="Expiry rate"
          value={`${data.expiryRate}%`}
          icon={CircleAlert}
          tone="danger"
        />
        <MetricCard
          label="No-show rate"
          value={`${data.noShowRate}%`}
          icon={CircleAlert}
          tone="warning"
        />
        <MetricCard
          label="Avg time to first claim"
          value={
            data.averageTimeToFirstClaimMinutes != null
              ? `${data.averageTimeToFirstClaimMinutes} min`
              : "—"
          }
          icon={Clock}
          tone="default"
        />
      </div>

      {/* Chart: Meals Recovered Trend */}
      <div className="rounded-2xl border border-zen-border bg-white p-6 shadow-subtle">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-lg font-bold text-ink">
              Meals Recovered — 14-Day Velocity
            </h2>
            <p className="text-xs font-mono text-zen-muted">
              Cumulative portions verified through cryptographic zero-trust handshakes
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-primary-faint/60 px-3 py-1 text-xs font-mono text-primary font-semibold">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Active Trajectory</span>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.mealsRecoveredTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="adminRecovered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#306d29" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#306d29" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e1b1" opacity={0.6} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#5c6e52" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#5c6e52" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e7e1b1",
                  backgroundColor: "#ffffff",
                  fontSize: 12,
                  boxShadow: "0 4px 12px rgba(48,80,40,0.1)",
                }}
                formatter={(value: number) => [`${value} portions`, "Recovered"]}
              />
              <Area type="monotone" dataKey="meals" stroke="#306d29" strokeWidth={2.5} fill="url(#adminRecovered)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart: Status Breakdown */}
      <div className="rounded-2xl border border-zen-border bg-white p-6 shadow-subtle">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-lg font-bold text-ink">
              Listings Status Distribution
            </h2>
            <p className="text-xs font-mono text-zen-muted">
              Real-time lifecycle breakdown across all catalogued food units
            </p>
          </div>
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e1b1" opacity={0.6} />
              <XAxis
                dataKey="status"
                tick={{ fontSize: 10, fill: "#5c6e52" }}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-18}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fontSize: 11, fill: "#5c6e52" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e7e1b1",
                  backgroundColor: "#ffffff",
                  fontSize: 12,
                  boxShadow: "0 4px 12px rgba(48,80,40,0.1)",
                }}
                formatter={(value: number) => [`${value} listings`, "Count"]}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {barData.map((entry) => (
                  <Cell key={entry.status} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
