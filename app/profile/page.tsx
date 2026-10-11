"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ShieldCheck, KeyRound, Loader2, Building2, Mail, Phone, CalendarDays, ListOrdered, ClipboardList, Lock, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";

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
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="skeleton h-12 w-64 rounded-2xl" />
          <div className="skeleton h-64 rounded-3xl" />
          <div className="skeleton h-72 rounded-3xl" />
        </div>
      </AppShell>
    );
  }

  if (status === "unauthenticated" || !account) return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Top Header */}
        <div className="border-b border-zen-border pb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
              Security & Credentials Vault
            </span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-ink">
            My Account
          </h1>
          <p className="mt-1 text-sm text-zen-muted font-sans">
            Manage your authenticated campus organization profile, security tokens, and access credentials.
          </p>
        </div>

        {/* Account Overview Card */}
        <div className="rounded-3xl border border-zen-border bg-white p-6 sm:p-8 shadow-subtle space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zen-border pb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white font-serif font-bold text-xl shadow-soft">
                {account.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl font-serif font-bold text-ink">{account.name}</h2>
                  <span className="rounded-full bg-primary-faint/70 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-primary">
                    {account.role}
                  </span>
                  <StatusBadge status={account.verificationStatus} />
                </div>
                <p className="mt-0.5 text-xs font-mono text-zen-muted">{account.organisationName}</p>
              </div>
            </div>
          </div>

          {/* Profile Specs Grid */}
          <dl className="grid gap-5 text-xs font-mono sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-page text-primary border border-zen-border">
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <dt className="text-zen-muted text-[11px]">Primary Email</dt>
                <dd className="font-semibold text-ink truncate">{account.email}</dd>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-page text-primary border border-zen-border">
                <Phone className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <dt className="text-zen-muted text-[11px]">Contact Phone</dt>
                <dd className="font-semibold text-ink">{account.phone || "Not configured"}</dd>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-page text-primary border border-zen-border">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <dt className="text-zen-muted text-[11px]">Organisation</dt>
                <dd className="font-semibold text-ink truncate">{account.organisationName}</dd>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-page text-primary border border-zen-border">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <dt className="text-zen-muted text-[11px]">Member Since</dt>
                <dd className="font-semibold text-ink">
                  {new Date(account.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </dd>
              </div>
            </div>

            {(account.role === "PROVIDER" || account.role === "ADMIN") && (
              <div className="flex items-center gap-3 sm:col-span-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-faint text-primary border border-zen-border">
                  <ListOrdered className="h-4 w-4" />
                </div>
                <div>
                  <dt className="text-zen-muted text-[11px]">Surplus Batches Logged</dt>
                  <dd className="font-serif font-bold text-ink text-sm">
                    {account.listingCount} published batches
                  </dd>
                </div>
              </div>
            )}

            {account.role === "RECIPIENT" && (
              <div className="flex items-center gap-3 sm:col-span-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-faint text-primary border border-zen-border">
                  <ClipboardList className="h-4 w-4" />
                </div>
                <div>
                  <dt className="text-zen-muted text-[11px]">Rescues Claimed</dt>
                  <dd className="font-serif font-bold text-ink text-sm">
                    {account.claimCount} successful claims
                  </dd>
                </div>
              </div>
            )}
          </dl>

          {account.role === "ADMIN" && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-primary/20 bg-primary-faint/30 p-3.5 text-xs font-mono text-ink">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>
                Administrative Authority: You possess full governance permissions across all campus users, verification queues, and audit streams.
              </span>
            </div>
          )}
        </div>

        {/* Change Password Card */}
        <form onSubmit={changePassword} className="rounded-3xl border border-zen-border bg-white p-6 sm:p-8 shadow-subtle space-y-5" noValidate>
          <div className="border-b border-zen-border pb-3">
            <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-ink">
              <KeyRound className="h-4 w-4 text-primary" aria-hidden />
              <span>Change Security Password</span>
            </h2>
            <p className="mt-1 text-xs text-zen-muted font-sans">
              Passwords are salted and cryptographically hashed with bcrypt. Your current password must be authenticated before modifications are committed.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-xs font-serif font-bold text-ink mb-1.5">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-zen-border bg-page/30 px-3.5 py-2.5 text-xs font-mono text-zen-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="newPassword" className="block text-xs font-serif font-bold text-ink mb-1.5">
                  New Password (min. 8 characters)
                </label>
                <input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-zen-border bg-page/30 px-3.5 py-2.5 text-xs font-mono text-zen-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create new password"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-serif font-bold text-ink mb-1.5">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-zen-border bg-page/30 px-3.5 py-2.5 text-xs font-mono text-zen-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="submit"
              disabled={saving || !currentPassword || newPassword.length < 8 || !confirmPassword}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white shadow-soft hover:bg-primary-hover active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <CheckCircle2 className="h-4 w-4" aria-hidden />
              )}
              <span>{saving ? "Authenticating & Updating…" : "Update Security Password"}</span>
            </button>

            <span className="text-[11px] font-mono text-zen-muted flex items-center gap-1">
              <Lock className="h-3 w-3 text-primary" />
              <span>Bcrypt Zero-Knowledge Vault</span>
            </span>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
