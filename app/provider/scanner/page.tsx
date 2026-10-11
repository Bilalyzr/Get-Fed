"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScanLine, ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";
import { QRScanner } from "@/components/QRScanner";
import { useToast } from "@/components/Toast";

export default function ScannerPage() {
  const { toast } = useToast();
  const [lastVerified, setLastVerified] = useState<string | null>(null);

  useEffect(() => {
    toast("info", "Scanner active — each QR is verified cryptographically on the server.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/provider/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zen-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Provider Dashboard</span>
        </Link>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-soft">
          <ScanLine className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-ink">
          Handshake Scanner
        </h1>
        <p className="text-xs text-zen-muted font-mono max-w-sm mx-auto">
          Scan the recipient&apos;s dynamic QR token at service docks to verify ownership and mark meals collected.
        </p>
      </div>

      {/* Scanner Card */}
      <div className="rounded-3xl border border-zen-border bg-white p-6 shadow-soft">
        <QRScanner onResult={() => setLastVerified(new Date().toISOString())} />
      </div>

      {lastVerified && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary-faint/40 p-3 text-xs font-mono text-ink">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span>
            Verified pickup at{" "}
            {new Date(lastVerified).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              second: "2-digit",
            })}
            . Single-use token invalidated.
          </span>
        </div>
      )}

      {/* Verification Explanation */}
      <div className="rounded-2xl border border-zen-border bg-white p-5 shadow-subtle space-y-2 text-xs text-zen-muted">
        <div className="flex items-center gap-2 font-serif font-bold text-ink text-sm">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Zero-Trust Cryptographic Handshake</span>
        </div>
        <p className="leading-relaxed font-sans text-zen-text">
          The recipient&apos;s QR code encodes a short-lived cryptographic envelope containing claim parameters and a unique signature.
          Upon scan, Get Fed validates that the reservation exists, the pickup window is active, and marks portions as irreversibly collected.
        </p>
      </div>
    </div>
  );
}
