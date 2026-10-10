"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { QrCode, MapPin, Clock3, Utensils, Loader2, Truck, PackageCheck } from "lucide-react";
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
        // Auto-select the first active claim if none preselected.
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
    <div className="mx-auto max-w-md space-y-5">
      <div className="text-center">
        <span className="inline-flex rounded-2xl bg-green-700 p-3 text-white" aria-hidden>
          <QrCode className="h-6 w-6" />
        </span>
        <h1 className="mt-3 text-2xl font-extrabold text-stone-900">Your pickup QR</h1>
        <p className="mt-1 text-sm text-stone-500">
          Show this code to the provider at pickup. It works offline and is
          verified securely server-side.
        </p>
      </div>

      {claims === null ? (
        <div className="skeleton h-64" />
      ) : activeClaims.length === 0 ? (
        <div className="card p-8 text-center text-sm text-stone-500">
          No active claims to show.{" "}
          <Link href="/recipient/food" className="font-semibold text-green-700">
            Discover food
          </Link>
        </div>
      ) : (
        <>
          {activeClaims.length > 1 && (
            <div className="card p-3">
              <label htmlFor="claim-select" className="label !mb-1">
                Select claim
              </label>
              <select
                id="claim-select"
                className="input"
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
            <div className="card flex h-72 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-stone-300" aria-hidden />
            </div>
          ) : error ? (
            <div className="card p-6 text-center text-sm text-rose-600" role="alert">
              {error}
            </div>
          ) : qr ? (
            <div className="card space-y-4 p-6 text-center">
              <QRGenerator
                signedPayload={qr.signedPayload}
                caption="Screenshot-proof: this code refreshes securely per claim."
              />

              <div className="space-y-2 rounded-xl bg-stone-50 p-4 text-left text-sm">
                <p className="flex items-center gap-2 font-bold text-stone-900">
                  <Utensils className="h-4 w-4 text-green-700" aria-hidden />
                  {qr.foodName} — {qr.quantity}
                </p>
                <p className="flex items-center gap-2 text-stone-600">
                  <MapPin className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
                  {qr.pickupAddress}
                </p>
                <p className="flex items-center gap-2 text-stone-600">
                  <Clock3 className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
                  <CountdownTimer deadline={qr.pickupDeadline} />
                </p>
                <div className="pt-1">
                  <StatusBadge status={qr.status} />
                </div>
              </div>

              {qr.status === "RESERVED" && (
                <button onClick={startPickup} className="btn-secondary w-full">
                  <Truck className="h-4 w-4" aria-hidden />
                  I&apos;m on the way — notify provider
                </button>
              )}
              {qr.status === "PICKUP_IN_PROGRESS" && (
                <p className="flex items-center justify-center gap-2 text-sm text-indigo-700">
                  <PackageCheck className="h-4 w-4" aria-hidden />
                  Provider notified — heading to pickup.
                </p>
              )}
            </div>
          ) : null}
        </>
      )}

      <p className="text-center text-xs text-stone-400">
        Each QR contains a unique cryptographic token bound to your claim. A
        second scan attempt is always rejected.
      </p>
    </div>
  );
}

export default function RecipientQrPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-stone-300" aria-hidden />
        </div>
      }
    >
      <QrPageInner />
    </Suspense>
  );
}
