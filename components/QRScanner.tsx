"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { ScanLine, Camera, CameraOff, CircleCheck, CircleAlert } from "lucide-react";

// ---------------------------------------------------------------------------
// QR scanner (PRD §27/§48): html5-qrcode camera scanning. Every scan result is
// sent to /api/claims/scan/verify for SERVER-side validation — the client
// never trusts the QR contents beyond passing them on.
// ---------------------------------------------------------------------------

type ScanResult =
  | { kind: "idle" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function QRScanner({ onResult }: { onResult?: () => void }) {
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResult>({ kind: "idle" });
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = "qr-reader";

  useEffect(() => {
    return () => {
      // Stop camera on unmount.
      scannerRef.current
        ?.stop()
        .catch(() => undefined)
        .finally(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
        });
    };
  }, []);

  async function start() {
    setResult({ kind: "idle" });
    try {
      const scanner = new Html5Qrcode(elementId, { verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decodedText) => {
          if (busy) return;
          setBusy(true);
          await scanner.stop().catch(() => undefined);
          setScanning(false);
          try {
            const res = await fetch("/api/claims/scan/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ payload: decodedText }),
            });
            const json = await res.json();
            if (json.success) {
              setResult({ kind: "success", message: json.data.message });
              onResult?.();
            } else {
              setResult({ kind: "error", message: json.message ?? "Verification failed." });
            }
          } catch {
            setResult({ kind: "error", message: "Network error during verification." });
          } finally {
            setBusy(false);
          }
        },
        () => undefined // per-frame decode errors are noise
      );
      setScanning(true);
    } catch (error) {
      setResult({
        kind: "error",
        message:
          "Could not access the camera. Allow camera permission and use HTTPS or localhost.",
      });
      console.error("[scanner] start failed:", error);
    }
  }

  async function stop() {
    await scannerRef.current?.stop().catch(() => undefined);
    setScanning(false);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        id={elementId}
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-stone-900 ring-1 ring-stone-300"
        aria-label="QR scanner viewport"
      />

      {!scanning ? (
        <button type="button" onClick={start} className="btn-primary" disabled={busy}>
          <Camera className="h-5 w-5" aria-hidden />
          {busy ? "Verifying…" : "Start scanner"}
        </button>
      ) : (
        <button type="button" onClick={stop} className="btn-secondary">
          <CameraOff className="h-5 w-5" aria-hidden />
          Stop scanner
        </button>
      )}

      {result.kind === "success" && (
        <div
          role="status"
          className="flex w-full max-w-sm items-start gap-3 rounded-xl bg-green-50 p-4 text-sm text-green-900 ring-1 ring-green-600/20"
        >
          <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden />
          <div>
            <p className="font-bold">Pickup verified</p>
            <p className="mt-0.5">{result.message}</p>
          </div>
        </div>
      )}
      {result.kind === "error" && (
        <div
          role="alert"
          className="flex w-full max-w-sm items-start gap-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-900 ring-1 ring-rose-600/20"
        >
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden />
          <div>
            <p className="font-bold">Verification rejected</p>
            <p className="mt-0.5">{result.message}</p>
          </div>
        </div>
      )}

      {result.kind === "idle" && !scanning && (
        <p className="flex items-center gap-2 text-sm text-stone-500">
          <ScanLine className="h-4 w-4" aria-hidden />
          Point the camera at a recipient&apos;s QR code to verify pickup.
        </p>
      )}
    </div>
  );
}
