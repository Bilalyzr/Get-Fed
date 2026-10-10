"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, RefreshCw, ShieldCheck, Ban, Undo2 } from "lucide-react";
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

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (tab !== "ALL") params.set("role", tab);
      if (search) params.set("q", search);
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const json = await res.json();
      if (json.success) setUsers(json.data);
    } catch {
      toast("error", "Could not load users.");
    }
  }, [tab, search, toast]);

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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">User management</h1>
          <p className="text-sm text-stone-500">
            Verify recipients, suspend accounts, monitor activity.
          </p>
        </div>
        <button onClick={load} className="btn-secondary" aria-label="Refresh users">
          <RefreshCw className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2" role="tablist" aria-label="Role filter">
          {TABS.map((value) => (
            <button
              key={value}
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium capitalize ${
                tab === value
                  ? "bg-green-700 text-white"
                  : "bg-white text-stone-600 ring-1 ring-stone-300 hover:bg-stone-50"
              }`}
            >
              {value.toLowerCase()}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
            aria-hidden
          />
          <input
            type="search"
            className="input pl-9"
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
            <div key={i} className="skeleton h-20" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <p className="card p-10 text-center text-sm text-stone-500">No users found.</p>
      ) : (
        <ul className="card divide-y divide-stone-100" role="list">
          {users.map((user) => (
            <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-stone-900">{user.organisationName}</p>
                  <span className="badge badge-requested">{user.role.toLowerCase()}</span>
                  <StatusBadge status={user.verificationStatus} />
                </div>
                <p className="mt-0.5 text-xs text-stone-500">
                  {user.name} · joined{" "}
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              {user.role !== "ADMIN" && (
                <div className="flex flex-wrap gap-2">
                  {user.verificationStatus !== "VERIFIED" && (
                    <button
                      onClick={() => setVerification(user.id, "VERIFIED", user.organisationName)}
                      disabled={busy === user.id}
                      className="btn-primary !px-3 !py-1.5 text-xs"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                      Verify
                    </button>
                  )}
                  {user.verificationStatus !== "SUSPENDED" ? (
                    <button
                      onClick={() => setVerification(user.id, "SUSPENDED", user.organisationName)}
                      disabled={busy === user.id}
                      className="btn-danger !px-3 !py-1.5 text-xs"
                    >
                      <Ban className="h-3.5 w-3.5" aria-hidden />
                      Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => setVerification(user.id, "VERIFIED", user.organisationName)}
                      disabled={busy === user.id}
                      className="btn-secondary !px-3 !py-1.5 text-xs"
                    >
                      <Undo2 className="h-3.5 w-3.5" aria-hidden />
                      Reinstate
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
