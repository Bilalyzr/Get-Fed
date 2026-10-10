"use client";

import { useEffect, useState } from "react";
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
import { PackageCheck, Activity, CircleAlert, Percent, RefreshCw } from "lucide-react";
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
  AVAILABLE: "#16a34a",
  PARTIALLY_RESERVED: "#0284c7",
  FULLY_RESERVED: "#d97706",
  PICKUP_IN_PROGRESS: "#6366f1",
  COLLECTED: "#059669",
  EXPIRED: "#78716c",
  CANCELLED: "#e11d48",
  DRAFT: "#a8a29e",
};

export default function AdminAnalyticsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/analytics");
        const json = await res.json();
        if (json.success) setData(json.data.analytics);
      } catch {
        toast("error", "Could not load analytics.");
      }
    })();
  }, [toast]);

  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-28" />
        ))}
      </div>
    );
  }

  const barData = data.statusBreakdown.map((s) => ({
    status: s.status.replace(/_/g, " ").toLowerCase(),
    count: s.count,
    color: STATUS_COLORS[s.status] ?? "#a8a29e",
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">Platform analytics</h1>
          <p className="text-sm text-stone-500">
            KPIs per PRD §41 — collected quantity is the north-star.
          </p>
        </div>
        <button onClick={() => window.location.reload()} className="btn-secondary">
          <RefreshCw className="h-4 w-4" aria-hidden />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Meals recovered"
          value={data.mealsRecovered}
          icon={PackageCheck}
          tone="success"
          hint="North-star metric"
        />
        <MetricCard label="Collection success rate" value={`${data.collectionRate}%`} icon={Activity} tone="success" />
        <MetricCard label="Claim conversion rate" value={`${data.claimConversionRate}%`} icon={Percent} tone="info" />
        <MetricCard label="Expiry rate" value={`${data.expiryRate}%`} icon={CircleAlert} tone="danger" />
        <MetricCard label="No-show rate" value={`${data.noShowRate}%`} icon={CircleAlert} tone="warning" />
        <MetricCard
          label="Avg time to first claim"
          value={
            data.averageTimeToFirstClaimMinutes != null
              ? `${data.averageTimeToFirstClaimMinutes} min`
              : "—"
          }
          icon={Activity}
          tone="default"
        />
      </div>

      <div className="card p-5">
        <h2 className="font-bold text-stone-900">Meals recovered — last 14 days</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.mealsRecoveredTrend} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="adminRecovered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a34a" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#78716c" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#78716c" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e7e5e4", fontSize: 12 }}
                formatter={(value: number) => [`${value} meals`, "Recovered"]}
              />
              <Area type="monotone" dataKey="meals" stroke="#16a34a" strokeWidth={2} fill="url(#adminRecovered)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-bold text-stone-900">Listings by status</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis
                dataKey="status"
                tick={{ fontSize: 10, fill: "#78716c" }}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-18}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fontSize: 11, fill: "#78716c" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e7e5e4", fontSize: 12 }}
                formatter={(value: number) => [`${value} listings`, ""]}
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
