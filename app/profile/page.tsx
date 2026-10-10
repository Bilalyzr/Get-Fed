"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  UserCircle,
  ShieldCheck,
  KeyRound,
  Loader2,
  Building2,
  Mail,
  Phone,
  CalendarDays,
  ListOrdered,
  ClipboardList,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";

// ---------------------------------------------------------------------------
// Account profile — works for EVERY role (admin included). Shows account
// details and provides a working password change backed by the server.
// ---------------------------------------------------------------------------

type Account = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  organisationName: string;
  verificationStatus: string;
  createdAt: string;
  listingCount: number;
  claimCount: number;
};

export default function AccountProfilePage() {
  const { status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [account, setAccount] = useState<Account | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=%2Fprofile");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      try {
        const res = await fetch("/api/account/me");
        const json = await res.json();
        if (json.success) setAccount(json.data);
      } catch {
        toast("error", "Could not load your account.");
      }
    })();
  }, [status, toast]);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast("error", "New passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        toast("success", json.data.message);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast("error", json.message ?? "Password change failed.");
      }
    } catch {
      toast("error", "Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || (status === "authenticated" && !account)) {
    return (
      <AppShell>
        <div className="space-y-4">
          <div className="skeleton h-8 w-52" />
          <div className="skeleton h-56" />
          <div className="skeleton h-64" />
        </div>
      </AppShell>
    );
  }

  if (status === "unauthenticated" || !account) return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">My account</h1>
          <p className="text-sm text-stone-500">
            Your account details and security settings.
          </p>
        </div>

        {/* Account overview */}
        <div className="card p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-green-100 p-3 text-green-700" aria-hidden>
              <UserCircle className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-stone-900">{account.name}</h2>
                <span className="badge badge-requested">
                  {account.role.toLowerCase()}
                </span>
                <StatusBadge status={account.verificationStatus} />
              </div>
              <p className="mt-0.5 text-sm text-stone-500">{account.organisationName}</p>
            </div>
          </div>

          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
              <div>
                <dt className="text-xs text-stone-400">Email</dt>
                <dd className="text-stone-700">{account.email}</dd>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
              <div>
                <dt className="text-xs text-stone-400">Phone</dt>
                <dd className="text-stone-700">{account.phone}</dd>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Building2 className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
              <div>
                <dt className="text-xs text-stone-400">Organisation</dt>
                <dd className="text-stone-700">{account.organisationName}</dd>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <CalendarDays className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
              <div>
                <dt className="text-xs text-stone-400">Member since</dt>
                <dd className="text-stone-700">
                  {new Date(account.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </dd>
              </div>
            </div>
            {(account.role === "PROVIDER" || account.role === "ADMIN") && (
              <div className="flex items-center gap-2.5">
                <ListOrdered className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
                <div>
                  <dt className="text-xs text-stone-400">Listings published</dt>
                  <dd className="text-stone-700">{account.listingCount}</dd>
                </div>
              </div>
            )}
            {account.role === "RECIPIENT" && (
              <div className="flex items-center gap-2.5">
                <ClipboardList className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
                <div>
                  <dt className="text-xs text-stone-400">Claims made</dt>
                  <dd className="text-stone-700">{account.claimCount}</dd>
                </div>
              </div>
            )}
          </dl>

          {account.role === "ADMIN" && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-sky-50 p-3 text-sm text-sky-800 ring-1 ring-sky-600/20">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              Administrators manage users, verification, listings, claims and
              platform analytics from the admin console.
            </p>
          )}
        </div>

        {/* Password change */}
        <form onSubmit={changePassword} className="card p-5 sm:p-6" noValidate>
          <h2 className="flex items-center gap-2 font-bold text-stone-900">
            <KeyRound className="h-4 w-4 text-stone-400" aria-hidden />
            Change password
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Passwords are hashed with bcrypt — your current password is verified
            server-side before anything changes.
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="currentPassword" className="label">
                Current password
              </label>
              <input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                className="input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="newPassword" className="label">
                  New password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  className="input"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="label">
                  Confirm new password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className="input"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !currentPassword || newPassword.length < 8 || !confirmPassword}
            className="btn-primary mt-5"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <KeyRound className="h-4 w-4" aria-hidden />
            )}
            {saving ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
