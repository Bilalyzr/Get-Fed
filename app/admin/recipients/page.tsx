"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, HeartHandshake, ShieldCheck, Ban, Undo2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";

type UserRow = {
  id: string;
  name: string;
  email: string;
  organisationName: string;
  verificationStatus: string;
  createdAt: string;
  _count?: { claims: number };
};

export default function AdminRecipientsPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users?role=RECIPIENT");
      const json = await res.json();
      if (json.success) setUsers(json.data);
    } catch {
      toast("error", "Could not load recipients.");
    }
  }, [toast]);

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
          <h1 className="text-2xl font-extrabold text-stone-900">Recipients</h1>
          <p className="text-sm text-stone-500">
            Only VERIFIED recipients can claim food (PRD rule).
          </p>
        </div>
        <button onClick={load} className="btn-secondary" aria-label="Refresh">
          <RefreshCw className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {!users ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      ) : (
        <ul className="card divide-y divide-stone-100" role="list">
          {users.map((user) => (
            <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-green-100 p-2 text-green-700" aria-hidden>
                  <HeartHandshake className="h-4 w-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-stone-900">{user.organisationName}</p>
                    <StatusBadge status={user.verificationStatus} />
                  </div>
                  <p className="text-xs text-stone-500">
                    {user.name} · {user._count?.claims ?? 0} claim
                    {(user._count?.claims ?? 0) === 1 ? "" : "s"} · joined{" "}
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
