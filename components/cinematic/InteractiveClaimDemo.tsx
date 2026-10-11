"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, ScanLine, CheckCircle2, Lock, ArrowRight, Sparkles, RefreshCw, Clock, Utensils } from "lucide-react";
import confetti from "canvas-confetti";

export function InteractiveClaimDemo() {
  const [totalSurplus] = useState<number>(50);
  const [claimedQuantity, setClaimedQuantity] = useState<number>(18);
  const [stage, setStage] = useState<"idle" | "locking" | "qr_ready" | "scanning" | "collected">("idle");
  const [tokenHash, setTokenHash] = useState<string>("");

  const remaining = totalSurplus - (stage === "collected" || stage === "qr_ready" ? claimedQuantity : 0);

  const handleClaim = () => {
    setStage("locking");
    setTimeout(() => {
      const generatedHash = "gf_token_" + Math.random().toString(36).substring(2, 10).toUpperCase();
      setTokenHash(generatedHash);
      setStage("qr_ready");
    }, 900);
  };

  const handleScan = () => {
    setStage("scanning");
    setTimeout(() => {
      setStage("collected");
      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#306d29", "#4e8b45", "#e7e1b1", "#0d530e"],
        });
      } catch {
        // Fallback gracefully
      }
    }, 1200);
  };

  const handleReset = () => {
    setStage("idle");
    setTokenHash("");
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-zen-border-strong bg-warm/30 p-6 sm:p-10 shadow-soft">
      {/* Glow rings */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary-faint/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 grid gap-8 lg:grid-cols-12 items-center">
        {/* Left column: Explanatory & Controls */}
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-soft bg-primary-faint px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Interactive Protocol Sandbox</span>
          </div>

          <h3 className="mt-3 text-2xl sm:text-4xl font-serif font-bold text-ink">
            Test the <span className="text-primary italic font-serif">Atomic Claim Engine</span> in real-time
          </h3>

          <p className="mt-3 text-sm sm:text-base text-zen-muted leading-relaxed">
            Experience why Get Fed eliminates double-bookings. Try taking a partial quantity. Watch the row-level
            database lock allocate meals, mint a cryptographically-secured QR token, and verify pickup in seconds.
          </p>

          {/* Interactive controls */}
          <div className="mt-6 rounded-2xl border border-zen-border bg-white p-5 shadow-subtle">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-zen-muted">
              <span>Simulated Listing</span>
              <span className="text-primary">Campus Center · Hall 4</span>
            </div>

            <div className="mt-2 flex items-center justify-between border-b border-zen-border pb-3">
              <div>
                <h4 className="font-serif font-bold text-ink text-base">Fresh Mediterranean Grain Bowls</h4>
                <p className="text-xs text-zen-muted flex items-center gap-1.5 mt-0.5">
                  <Clock className="h-3 w-3 text-primary" /> 52 min pickup window · Verified Kitchen
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono text-2xl font-bold text-primary">{remaining}</span>
                <span className="block text-[10px] uppercase font-mono text-zen-muted">Meals Available</span>
              </div>
            </div>

            {/* Slider */}
            <div className="mt-4">
              <div className="flex justify-between items-center text-xs font-semibold text-zen-text">
                <label htmlFor="claim-slider" className="flex items-center gap-1.5">
                  <Utensils className="h-3.5 w-3.5 text-primary" />
                  Your Organisation Needs:
                </label>
                <span className="font-mono text-primary font-bold text-sm bg-primary-faint px-2 py-0.5 rounded-md">
                  {claimedQuantity} meals
                </span>
              </div>

              <input
                id="claim-slider"
                type="range"
                min="1"
                max={totalSurplus}
                disabled={stage !== "idle"}
                value={claimedQuantity}
                onChange={(e) => setClaimedQuantity(Number(e.target.value))}
                className="mt-2 w-full accent-primary cursor-pointer disabled:opacity-50"
              />

              <div className="mt-1 flex justify-between text-[10px] font-mono text-zen-faint">
                <span>1 meal</span>
                <span>Partial allocation (no overbooking)</span>
                <span>{totalSurplus} meals</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-5 flex items-center gap-3">
              {stage === "idle" && (
                <button
                  onClick={handleClaim}
                  data-cursor="RESERVE"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 px-4 text-sm font-semibold text-white shadow-subtle hover:bg-primary-hover active:scale-[0.98] transition-all"
                >
                  <Lock className="h-4 w-4" />
                  <span>Reserve {claimedQuantity} Meals (Atomic Lock)</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}

              {stage === "locking" && (
                <div className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-surface-soft py-3 px-4 text-sm font-semibold text-primary animate-pulse">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                  <span>Acquiring Database Row-Level Lock...</span>
                </div>
              )}

              {(stage === "qr_ready" || stage === "scanning" || stage === "collected") && (
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-xl border border-zen-border bg-page py-2.5 px-4 text-xs font-semibold text-zen-muted hover:text-ink hover:bg-surface-soft transition-all"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Reset Sandbox</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Dynamic Holographic QR Handshake Terminal */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-full max-w-sm rounded-3xl border border-zen-border-strong bg-white p-6 shadow-elevated">
            {/* Phone header mockup */}
            <div className="flex items-center justify-between border-b border-zen-border pb-3 text-xs font-mono text-zen-muted">
              <span className="flex items-center gap-1.5 font-bold text-ink">
                <span className="h-2 w-2 rounded-full bg-primary" /> GET FED CLIENT
              </span>
              <span>TOKEN #8491</span>
            </div>

            <div className="mt-5 flex flex-col items-center text-center">
              <AnimatePresence mode="wait">
                {stage === "idle" && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-12 px-4"
                  >
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-soft text-zen-muted border border-zen-border">
                      <QrCode className="h-10 w-10 text-primary/40" />
                    </div>
                    <p className="mt-4 font-serif text-base font-bold text-ink">Awaiting Reservation</p>
                    <p className="mt-1 text-xs text-zen-muted max-w-xs">
                      Adjust meal slider on the left and tap reserve to trigger atomic token minting.
                    </p>
                  </motion.div>
                )}

                {stage === "locking" && (
                  <motion.div
                    key="locking"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-12 px-4"
                  >
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-faint text-primary border border-primary-soft">
                      <Lock className="h-10 w-10 animate-bounce" />
                    </div>
                    <p className="mt-4 font-serif text-base font-bold text-ink">Checking Inventory</p>
                    <p className="mt-1 text-xs text-zen-muted font-mono">
                      BEGIN TRANSACTION; <br />
                      SELECT FOR UPDATE;
                    </p>
                  </motion.div>
                )}

                {(stage === "qr_ready" || stage === "scanning" || stage === "collected") && (
                  <motion.div
                    key="qr"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full flex flex-col items-center"
                  >
                    {/* Simulated SVG QR code frame */}
                    <div className="relative mt-2 p-4 bg-white rounded-2xl border-2 border-primary-soft/60 shadow-subtle">
                      {/* Scanning laser beam animation */}
                      {stage === "scanning" && (
                        <motion.div
                          initial={{ top: "0%" }}
                          animate={{ top: "100%" }}
                          transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                          className="absolute left-2 right-2 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_12px_#306d29] z-20"
                        />
                      )}

                      {/* Stylized QR Matrix */}
                      <div className="relative flex flex-col items-center justify-center p-2">
                        <svg className="w-40 h-40 text-ink" viewBox="0 0 100 100" fill="currentColor">
                          <rect x="0" y="0" width="28" height="28" rx="4" />
                          <rect x="4" y="4" width="20" height="20" fill="white" rx="2" />
                          <rect x="8" y="8" width="12" height="12" fill="currentColor" rx="1" />

                          <rect x="72" y="0" width="28" height="28" rx="4" />
                          <rect x="76" y="4" width="20" height="20" fill="white" rx="2" />
                          <rect x="80" y="8" width="12" height="12" fill="currentColor" rx="1" />

                          <rect x="0" y="72" width="28" height="28" rx="4" />
                          <rect x="4" y="76" width="20" height="20" fill="white" rx="2" />
                          <rect x="8" y="80" width="12" height="12" fill="currentColor" rx="1" />

                          {/* Data points */}
                          <rect x="36" y="12" width="8" height="8" />
                          <rect x="52" y="16" width="8" height="8" />
                          <rect x="36" y="36" width="12" height="12" fill="#306d29" />
                          <rect x="56" y="40" width="8" height="8" />
                          <rect x="72" y="36" width="8" height="16" />
                          <rect x="40" y="60" width="12" height="8" />
                          <rect x="60" y="64" width="16" height="8" />
                          <rect x="36" y="80" width="8" height="12" />
                          <rect x="76" y="80" width="16" height="12" />
                        </svg>

                        {stage === "collected" && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm rounded-xl"
                          >
                            <CheckCircle2 className="h-14 w-14 text-primary" />
                            <span className="font-serif text-lg font-bold text-ink mt-2">Verified & Handed Over</span>
                            <span className="text-xs font-mono text-zen-muted">Meals Saved: +{claimedQuantity}</span>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    <p className="mt-3 text-xs font-mono font-bold text-primary">{tokenHash}</p>
                    <p className="text-[11px] text-zen-muted mt-0.5">
                      Reserved: {claimedQuantity} meals · 1 scan verification
                    </p>

                    {/* Interactive Scan Action */}
                    {stage === "qr_ready" && (
                      <button
                        onClick={handleScan}
                        data-cursor="SCAN"
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-xs font-semibold text-white shadow-subtle hover:bg-ink/90 active:scale-95 transition-all"
                      >
                        <ScanLine className="h-4 w-4 text-emerald-400" />
                        <span>Simulate Kitchen Camera Scan</span>
                      </button>
                    )}

                    {stage === "scanning" && (
                      <div className="mt-4 inline-flex items-center gap-2 text-xs font-mono text-primary font-bold">
                        <ScanLine className="h-4 w-4 animate-spin text-primary" />
                        <span>Validating Cryptographic Handshake...</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
