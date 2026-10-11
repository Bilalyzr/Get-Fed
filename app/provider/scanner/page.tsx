"use client";

import { useEffect, useState } from "react";
import { ScanLine } from "lucide-react";
import { QRScanner } from "@/components/QRScanner";
import { useToast } from "@/components/Toast";
import { BackButton } from "@/components/BackButton";

export default function ScannerPage() {
  const { toast } = useToast();
  const [lastVerified, setLastVerified] = useState<string | null>(null);

  useEffect(() => {
    toast("info", "Scanner ready — each QR is verified server-side with a secure token.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex justify-start">
        <BackButton fallbackHref="/provider/dashboard" label="Back to dashboard" />
      </div>
      <div className="text-center">
        <span className="inline-flex rounded-2xl bg-green-700 p-3 text-white" aria-hidden>
          <ScanLine className="h-6 w-6" />
        </span>
        <h1 className="mt-3 text-2xl font-extrabold text-stone-900">Pickup scanner</h1>
        <p className="mt-1 text-sm text-stone-500">
          Scan a recipient&apos;s QR code to verify and record collection.
        </p>
      </div>

      <QRScanner onResult={() => setLastVerified(new Date().toISOString())} />

      {lastVerified && (
        <p className="text-center text-xs text-stone-400">
          Last verified at{" "}
          {new Date(lastVerified).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
          })}
          . The same QR cannot be used twice.
        </p>
      )}

      <div className="card bg-stone-50 p-4 text-xs leading-relaxed text-stone-500">
        <p className="font-semibold text-stone-700">How verification works</p>
        <p className="mt-1">
          The QR carries a signed envelope containing the claim ID and a
          cryptographically secure token. Your scan sends it to the server,
          which validates the signature, the token, your ownership of the
          listing, the claim status and the pickup deadline — only then is the
          claim marked COLLECTED.
        </p>
      </div>
    </div>
  );
}
