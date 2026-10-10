"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Store } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";

type UserRow = {
  id: string;
  name: string;
  email: string;
  organisationName: string;
  verificationStatus: string;
  createdAt: string;
  _count?: { listings: number; claims: number };
};

export default function AdminProvidersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[] | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users?role=PROVIDER");
      const json = await res.json();
      if (json.success) setUsers(json.data);
    } catch {
      toast("error", "Could not load providers.");
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">Providers</h1>
          <p className="text-sm text-stone-500">Institutions publishing surplus food.</p>
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
            <li key={user.id} className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-sky-100 p-2 text-sky-700" aria-hidden>
                  <Store className="h-4 w-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-stone-900">{user.organisationName}</p>
                    <StatusBadge status={user.verificationStatus} />
                  </div>
                  <p className="text-xs text-stone-500">
                    {user.name} · {user._count?.listings ?? 0} listing
                    {(user._count?.listings ?? 0) === 1 ? "" : "s"} published
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
