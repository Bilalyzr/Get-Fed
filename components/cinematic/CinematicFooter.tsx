"use client";

import React from "react";
import Link from "next/link";
import { ArrowUp, ShieldCheck, Heart, Sparkles, MapPin, Clock, Scale } from "lucide-react";
import { Logo } from "@/components/Logo";

export function CinematicFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative border-t border-zen-border-strong bg-warm/20 pt-16 pb-12 text-zen-text overflow-hidden">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-64 w-[700px] rounded-full bg-primary-faint/30 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12 pb-12 border-b border-zen-border">
          {/* Col 1: Brand & Manifesto */}
          <div className="md:col-span-5">
            <Link href="/" aria-label="Get Fed home" className="inline-block">
              <Logo size={40} withWordmark />
            </Link>
            <p className="mt-4 text-sm text-zen-muted leading-relaxed max-w-sm">
              The real-time coordination engine for time-sensitive surplus food.
              Transforming institutional oversupply into verified community nourishment before perishability windows expire.
            </p>

            <div className="mt-6 flex items-center gap-3 text-xs font-mono text-primary font-bold">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>REAL-TIME TRANSACTION INTEGRITY · VERIFIED</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="md:col-span-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
              Navigation
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/" className="text-zen-muted hover:text-ink transition-colors">
                  Platform Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-zen-muted hover:text-ink transition-colors">
                  About & Architecture
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-zen-muted hover:text-ink transition-colors">
                  Operational Lifecycle
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-zen-muted hover:text-ink transition-colors">
                  Provider Onboarding
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-zen-muted hover:text-ink transition-colors">
                  Sign in to Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Core Technology Pillars */}
          <div className="md:col-span-4">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
              Engine Specifications
            </h4>
            <div className="mt-4 space-y-3 text-xs font-mono text-zen-muted">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>90-Minute Perishability Time Engine</span>
              </div>
              <div className="flex items-center gap-2">
                <Scale className="h-3.5 w-3.5 text-primary" />
                <span>Strict Row-Level Locking (Anti-Overbooking)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span>Cryptographic QR Handshake Verification</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>Haversine Proximity Geofence Dispatch</span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-zen-border bg-white/80 p-4 shadow-subtle">
              <p className="font-serif text-xs font-bold text-ink">
                “Every meal worth saving is a meal saved.”
              </p>
              <p className="mt-1 text-[11px] text-zen-muted">
                Audit-grade food recovery with verified zero-trust logistics.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zen-muted">
          <div>
            © {new Date().getFullYear()} Get Fed. Built for institutional campuses and verified communities.
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zen-border bg-white px-3 py-1.5 text-xs text-zen-muted hover:text-ink hover:bg-surface-soft transition-all"
            >
              <span>Back to top</span>
              <ArrowUp className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
