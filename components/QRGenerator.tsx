"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { QrCode } from "lucide-react";

// ---------------------------------------------------------------------------
// QR generation (PRD §26/§48): renders the signed claim envelope server-side
// data into a scannable code. The token inside is cryptographically secure.
// ---------------------------------------------------------------------------

export function QRGenerator({
  signedPayload,
  size = 240,
  caption,
}: {
  signedPayload: string;
  size?: number;
  caption?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !signedPayload) return;
    QRCode.toCanvas(
      canvasRef.current,
      signedPayload,
      {
        width: size,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#1c1917", light: "#ffffff" },
      },
      (err) => {
        if (err) setError("Could not render QR code.");
      }
    );
  }, [signedPayload, size]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 text-rose-600" role="alert">
        <QrCode className="h-10 w-10" aria-hidden />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <figure className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Your pickup QR code — show this to the provider"
        className="rounded-xl ring-4 ring-green-100"
      />
      {caption && (
        <figcaption className="text-center text-sm text-stone-500">{caption}</figcaption>
      )}
    </figure>
  );
}
