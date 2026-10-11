"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Utensils,
  PackageCheck,
  CircleAlert,
  ClipboardX,
  Activity,
  RefreshCw,
  ArrowLeft,
  PieChart as PieIcon,
  Sparkles,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { useToast } from "@/components/Toast";

type Analytics = {
  activeListings: number;
  mealsAvailable: number;
  mealsClaimed: number;
  successfulCollections: number;
  expiredQuantity: number;
  cancelledClaims: number;
  collectionSuccessRate: number;
  claimConversionRate: number;
  mealsRecoveredTrend: { date: string; meals: number }[];
  categoryBreakdown: { category: string; quantity: number }[];
};

const CATEGORY_COLORS = [
  "#0d530e",
  "#306d29",
  "#4e8b45",
  "#c5d9a8",
  "#d97706",
  "#f59e0b",
  "#78716c",
];

const CATEGORY_LABELS: Record<string, string> = {
  COOKED_MEALS: "Cooked meals",
  BAKERY: "Bakery",
  PACKAGED: "Packaged",
  PRODUCE: "Produce",
  DAIRY: "Dairy",
  BEVERAGES: "Beverages",
  OTHER: "Other",
};

export default function ProviderAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  async function loadData(showSpinner = false) {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetch("/api/provider/analytics");
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      toast("error", "Could not load kitchen analytics.");
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

  const pieData = data.categoryBreakdown.map((c) => ({
    name: CATEGORY_LABELS[c.category] ?? c.category,
    value: c.quantity,
  }));

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zen-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/provider/dashboard"
              className="inline-flex items-center gap-1 text-xs font-mono text-zen-muted hover:text-ink transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Back to Overview</span>
            </Link>
          </div>
          <h1 className="text-3xl font-serif font-bold text-ink">
            Kitchen Impact Analytics
          </h1>
          <p className="mt-1 text-sm text-zen-muted">
            Telemetry and recovery efficiency metrics across your campus dining service surplus batches.
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

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Meals recovered"
          value={data.mealsClaimed - data.expiredQuantity > 0 ? data.mealsClaimed : data.successfulCollections}
          icon={PackageCheck}
          tone="success"
          hint="North-star metric"
        />
        <MetricCard label="Successful collections" value={data.successfulCollections} icon={PackageCheck} tone="success" />
        <MetricCard label="Collection success rate" value={`${data.collectionSuccessRate}%`} icon={Activity} tone="info" />
        <MetricCard label="Claim conversion rate" value={`${data.claimConversionRate}%`} icon={Utensils} tone="default" />
        <MetricCard label="Expired quantity" value={data.expiredQuantity} icon={CircleAlert} tone="danger" />
        <MetricCard label="Cancelled claims" value={data.cancelledClaims} icon={ClipboardX} tone="warning" />
      </div>

      {/* Chart: Meals Recovered Trend */}
      <div className="rounded-2xl border border-zen-border bg-white p-6 shadow-subtle">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-lg font-bold text-ink">
              Meals Recovered — 14-Day Trajectory
            </h2>
            <p className="text-xs font-mono text-zen-muted">
              Portions successfully transferred to verified local pantries
            </p>
          </div>
          <Sparkles className="h-5 w-5 text-primary" />
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.mealsRecoveredTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="recoveredGradient" x1="0" y1="0" x2="0" y2="1">
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
                formatter={(value: number) => [`${value} meals`, "Recovered"]}
              />
              <Area
                type="monotone"
                dataKey="meals"
                stroke="#306d29"
                strokeWidth={2.5}
                fill="url(#recoveredGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart: Category Breakdown */}
      {pieData.length > 0 && (
        <div className="rounded-2xl border border-zen-border bg-white p-6 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-ink">
                Surplus Volume by Category
              </h2>
              <p className="text-xs font-mono text-zen-muted">
                Nutritional taxonomy distribution across logged surplus batches
              </p>
            </div>
            <PieIcon className="h-5 w-5 text-primary" />
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="50%"
                  outerRadius="78%"
                  paddingAngle={3}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12, color: "#1f3a1d" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e7e1b1",
                    backgroundColor: "#ffffff",
                    fontSize: 12,
                    boxShadow: "0 4px 12px rgba(48,80,40,0.1)",
                  }}
                  formatter={(value: number) => [`${value} portions`, "Quantity"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
