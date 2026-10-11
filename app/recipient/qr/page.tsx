"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { QrCode, MapPin, Loader2, Truck, PackageCheck, ArrowLeft, ShieldCheck } from "lucide-react";
import { QRGenerator } from "@/components/QRGenerator";
import { CountdownTimer } from "@/components/CountdownTimer";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";

type QrData = {
  claimId: string;
  signedPayload: string;
  foodName: string;
  quantity: number;
  pickupDeadline: string;
  pickupAddress: string;
  status: string;
};

type ClaimOption = {
  id: string;
  quantity: number;
  status: string;
  listing: { foodName: string; unit: string; pickupDeadline: string; expired: boolean };
};

function QrPageInner() {
  const searchParams = useSearchParams();
  const preselect = searchParams.get("claim");
  const { toast } = useToast();
  const [claims, setClaims] = useState<ClaimOption[] | null>(null);
  const [selected, setSelected] = useState<string | null>(preselect);
  const [qr, setQr] = useState<QrData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);

  const loadClaims = useCallback(async () => {
    try {
      const res = await fetch("/api/claims/me?status=active");
      const json = await res.json();
      if (json.success) {
        setClaims(json.data);
        if (!preselect && json.data.length > 0) {
          setSelected(json.data[0].id);
        }
      }
    } catch {
      toast("error", "Could not load claims.");
    }
  }, [preselect, toast]);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setLoadingQr(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(`/api/claims/${selected}/qr`);
        const json = await res.json();
        if (cancelled) return;
        if (json.success) {
          setQr(json.data);
        } else {
          setQr(null);
          setError(json.message ?? "QR unavailable for this claim.");
        }
      } finally {
        if (!cancelled) setLoadingQr(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  async function startPickup() {
    if (!selected) return;
    const res = await fetch(`/api/claims/${selected}/pickup`, { method: "POST" });
    const json = await res.json();
    if (json.success) toast("success", json.data.message);
    else toast("error", json.message ?? "Failed.");
  }

  const activeClaims = (claims ?? []).filter((c) => !c.listing.expired);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/recipient/claims"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zen-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to My Claims</span>
        </Link>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-soft">
          <QrCode className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-ink">
          Pickup Access Pass
        </h1>
        <p className="text-xs text-zen-muted font-mono max-w-sm mx-auto">
          Present this dynamic cryptographic pass to kitchen staff at collection. Single-use handshake token.
        </p>
      </div>

      {claims === null ? (
        <div className="skeleton h-64 rounded-2xl" />
      ) : activeClaims.length === 0 ? (
        <div className="rounded-3xl border border-zen-border bg-white p-12 text-center shadow-subtle">
          <p className="text-sm font-serif font-bold text-ink">No Active Claims</p>
          <p className="mt-1 text-xs text-zen-muted">
            You don&apos;t have any active pickup passes right now.
          </p>
          <Link
            href="/recipient/food"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-subtle hover:bg-primary-hover transition-colors"
          >
            <span>Discover Food Nearby</span>
          </Link>
        </div>
      ) : (
        <>
          {activeClaims.length > 1 && (
            <div className="rounded-2xl border border-zen-border bg-white p-3.5 shadow-subtle">
              <label htmlFor="claim-select" className="block text-xs font-serif font-bold text-ink mb-1.5">
                Switch Active Pass
              </label>
              <select
                id="claim-select"
                className="w-full rounded-xl border border-zen-border bg-page/40 px-3 py-2 text-xs font-mono text-zen-text focus:border-primary focus:outline-none"
                value={selected ?? ""}
                onChange={(e) => setSelected(e.target.value)}
              >
                {activeClaims.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.listing.foodName} — {c.quantity} {c.listing.unit.toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {loadingQr ? (
            <div className="flex h-72 items-center justify-center rounded-3xl border border-zen-border bg-white shadow-subtle">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs font-mono text-rose-700">
              {error}
            </div>
          ) : qr ? (
            <div className="rounded-3xl border border-zen-border bg-white p-6 shadow-soft space-y-5 text-center">
              <div className="flex items-center justify-between border-b border-zen-border pb-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-primary font-bold">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Authenticated Token</span>
                </span>
                <span className="text-zen-muted">Claim #{qr.claimId.slice(-6)}</span>
              </div>

              <div className="p-2">
                <QRGenerator
                  signedPayload={qr.signedPayload}
                  caption="Cryptographic handshake envelope · Refreshes upon each collection cycle"
                />
              </div>

              {/* Meal Summary Box */}
              <div className="rounded-2xl border border-zen-border bg-page/40 p-4 text-left space-y-2 text-xs font-mono">
                <p className="flex items-center justify-between font-serif font-bold text-ink text-sm">
                  <span>{qr.foodName}</span>
                  <span className="font-mono text-xs font-normal text-primary">
                    {qr.quantity} portions
                  </span>
                </p>
                <p className="flex items-center gap-1.5 text-zen-muted">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">{qr.pickupAddress}</span>
                </p>
                <div className="flex items-center justify-between pt-1">
                  <CountdownTimer deadline={qr.pickupDeadline} />
                  <StatusBadge status={qr.status} />
                </div>
              </div>

              {qr.status === "RESERVED" && (
                <button
                  onClick={startPickup}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-subtle hover:bg-primary-hover active:scale-95 transition-all"
                >
                  <Truck className="h-4 w-4" />
                  <span>I&apos;m on the way — Notify Provider</span>
                </button>
              )}

              {qr.status === "PICKUP_IN_PROGRESS" && (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-primary-faint/60 py-2.5 text-xs font-mono font-semibold text-primary">
                  <PackageCheck className="h-4 w-4" />
                  <span>Kitchen notified · Proceed to service dock</span>
                </div>
              )}
            </div>
          ) : null}
        </>
      )}

      <p className="text-center text-xs font-mono text-zen-muted">
        Zero-trust verification: This QR carries a signed payload bound to your verified organisation.
      </p>
    </div>
  );
}

export default function RecipientQrPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        </div>
      }
    >
      <QrPageInner />
    </Suspense>
  );
}
