"use client";

import { useEffect, useState } from "react";
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
  "#166534",
  "#16a34a",
  "#22c55e",
  "#84cc16",
  "#eab308",
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
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/provider/analytics");
        const json = await res.json();
        if (json.success) setData(json.data);
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

  const pieData = data.categoryBreakdown.map((c) => ({
    name: CATEGORY_LABELS[c.category] ?? c.category,
    value: c.quantity,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">Analytics</h1>
          <p className="text-sm text-stone-500">
            Impact of your surplus listings over time.
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

      <div className="card p-5">
        <h2 className="font-bold text-stone-900">Meals recovered — last 14 days</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.mealsRecoveredTrend} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="recoveredGradient" x1="0" y1="0" x2="0" y2="1">
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
              <Area
                type="monotone"
                dataKey="meals"
                stroke="#16a34a"
                strokeWidth={2}
                fill="url(#recoveredGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {pieData.length > 0 && (
        <div className="card p-5">
          <h2 className="font-bold text-stone-900">Quantity by food category</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="45%"
                  outerRadius="75%"
                  paddingAngle={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e7e5e4", fontSize: 12 }}
                  formatter={(value: number) => [`${value} units`, "Quantity"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
