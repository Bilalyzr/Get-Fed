"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, RefreshCw, ShieldCheck, Ban, Undo2, Users, ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  organisationName: string;
  verificationStatus: string;
  createdAt: string;
  _count?: { listings: number; claims: number };
};

const TABS = ["ALL", "PROVIDER", "RECIPIENT"] as const;

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("ALL");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setRefreshing(true);
      try {
        const params = new URLSearchParams();
        if (tab !== "ALL") params.set("role", tab);
        if (search) params.set("q", search);
        const res = await fetch(`/api/admin/users?${params.toString()}`);
        const json = await res.json();
        if (json.success) setUsers(json.data);
      } catch {
        toast("error", "Could not load users.");
      } finally {
        setRefreshing(false);
      }
    },
    [tab, search, toast]
  );

  useEffect(() => {
    load();
  }, [load]);

  async function setVerification(id: string, status: string, org: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/users/${id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        toast("success", `${org}: ${json.data.message}`);
        load();
      } else {
        toast("error", json.message ?? "Failed.");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
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
            Campus User Directory
          </h1>
          <p className="mt-1 text-sm text-zen-muted">
            Manage provider kitchens, recipient organizations, roles, and platform authorizations.
          </p>
        </div>

        <button
          onClick={() => load(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zen-border bg-white px-3.5 py-2 text-xs font-semibold text-zen-text shadow-subtle hover:bg-surface-soft active:scale-95 transition-all"
          disabled={refreshing}
          aria-label="Refresh users"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 text-zen-muted ${refreshing ? "animate-spin text-primary" : ""}`}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 rounded-xl border border-zen-border bg-white p-1 shadow-subtle" role="tablist">
          {TABS.map((value) => (
            <button
              key={value}
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                tab === value
                  ? "bg-primary text-white shadow-subtle font-semibold"
                  : "text-zen-muted hover:text-ink hover:bg-page/50"
              }`}
            >
              {value === "ALL" ? "All Users" : value === "PROVIDER" ? "Providers" : "Recipients"}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zen-muted"
            aria-hidden
          />
          <input
            type="search"
            className="w-full rounded-xl border border-zen-border bg-white py-2 pl-10 pr-4 text-xs font-mono text-zen-text shadow-subtle placeholder:text-zen-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Search name, org, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search users"
          />
        </div>
      </div>

      {!users ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-3xl border border-zen-border bg-white p-12 text-center shadow-subtle">
          <Users className="mx-auto h-12 w-12 text-zen-muted/60" />
          <h3 className="mt-4 font-serif text-lg font-bold text-ink">No Matching Users</h3>
          <p className="mt-1 text-xs text-zen-muted">
            Try adjusting your search criteria or role filters.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zen-border bg-white shadow-subtle divide-y divide-zen-border">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-4 p-5 hover:bg-page/40 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-faint text-ink border border-zen-border font-serif font-bold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-serif font-bold text-ink text-base">
                      {user.organisationName || user.name}
                    </p>
                    <span className="rounded-full bg-primary-faint/70 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-primary">
                      {user.role}
                    </span>
                    <StatusBadge status={user.verificationStatus} />
                  </div>
                  <p className="mt-0.5 text-xs text-zen-muted font-mono">
                    <span className="text-ink font-medium">{user.name}</span> · {user.email} · joined{" "}
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {user.role !== "ADMIN" && (
                <div className="flex items-center gap-2">
                  {user.verificationStatus !== "VERIFIED" && (
                    <button
                      onClick={() => setVerification(user.id, "VERIFIED", user.organisationName)}
                      disabled={busy === user.id}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-subtle hover:bg-primary-hover active:scale-95 transition-all disabled:opacity-50"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Verify</span>
                    </button>
                  )}
                  {user.verificationStatus !== "SUSPENDED" ? (
                    <button
                      onClick={() => setVerification(user.id, "SUSPENDED", user.organisationName)}
                      disabled={busy === user.id}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      <span>Suspend</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setVerification(user.id, "VERIFIED", user.organisationName)}
                      disabled={busy === user.id}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zen-border bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-subtle hover:bg-surface-soft active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                      <span>Reinstate</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
