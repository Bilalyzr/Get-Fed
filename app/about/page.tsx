"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Clock, Scale, Lock, ArrowRight, Sparkles, AlertTriangle, Cpu, BarChart3 } from "lucide-react";
import { CustomCursor } from "@/components/cinematic/CustomCursor";
import { CinematicNavbar } from "@/components/cinematic/CinematicNavbar";
import { CinematicFooter } from "@/components/cinematic/CinematicFooter";

export default function AboutPage() {

  const pillars = [
    {
      title: "Deterministic Concurrency Control",
      subtitle: "Eliminating the Double-Booking Hazard",
      icon: Scale,
      tech: "ACID Transactions · PostgreSQL Row Locks",
      narrative:
        "Conventional charity portals allow multiple users to click 'Claim' simultaneously, leading to humiliating situations where two community vans arrive for the same batch. Get Fed executes partial and full allocations under strict serializable row-level locking (`SELECT ... FOR UPDATE`). Inventory mutations are mathematically atomic.",
      metric: "0 Overbookings across all transactions",
    },
    {
      title: "Perishability Geofence Engine",
      subtitle: "Time-Distance Feasibility Scoring",
      icon: Clock,
      tech: "Haversine Distance · Transit Window Matrix",
      narrative:
        "Surplus hot food loses microbiological safety if transit times exceed the critical thermal decay window. Get Fed computes a real-time transit matrix before broadcasting listings. Only recipients who can physically arrive and transport the food before expiration receive high-priority push dispatch.",
      metric: "< 250ms dispatch calculation latency",
    },
    {
      title: "Zero-Trust Cryptographic Handshake",
      subtitle: "Verifiable Proof of Physical Exchange",
      icon: Lock,
      tech: "HMAC-SHA256 Signed QR Tokens · Nonce Validation",
      narrative:
        "Food distribution fails when delivery cannot be verified. Get Fed issues dynamic HMAC-signed QR tokens upon claim settlement. The donor scans this token with standard mobile cameras; our API validates signature authenticity, claim state, and active time-window in under 2 seconds.",
      metric: "100% Anti-tamper handover verification",
    },
  ];

  return (
    <div className="relative min-h-dvh flex flex-col bg-page text-zen-text font-sans antialiased selection:bg-primary-faint selection:text-ink overflow-x-hidden">
      <CustomCursor />
      <CinematicNavbar />

      {/* Hero Header */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
        {/* Ambient atmospheric backdrop */}
        <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center opacity-60">
          <div className="h-[500px] w-[700px] rounded-full bg-primary-faint/50 blur-[120px]" />
          <div className="absolute top-10 right-10 h-72 w-72 rounded-full bg-warm/60 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary-soft bg-primary-faint/60 px-4 py-1.5 text-xs font-mono font-bold tracking-wider text-primary uppercase shadow-subtle backdrop-blur-md"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Architecture & Philosophy Manifesto</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-4xl sm:text-6xl font-serif font-bold tracking-tight text-ink leading-[1.12]"
          >
            The Physics of <span className="text-primary italic font-serif">Perishability</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed text-zen-muted"
          >
            Why surplus food isn&apos;t a static inventory problem — it&apos;s a high-velocity coordination challenge
            governed by thermal decay, transit velocity, and concurrency hazards.
          </motion.p>
        </div>
      </section>

      {/* The Core Problem: Why Conventional Systems Collapse */}
      <section className="relative py-16 sm:py-20 border-t border-zen-border bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 items-center">
            <div className="lg:col-span-6">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-rose-700">
                The Structural Flaw
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-serif font-bold text-ink">
                Why WhatsApp groups & bulletin boards fail under pressure
              </h2>
              <p className="mt-4 text-sm sm:text-base text-zen-muted leading-relaxed">
                When a campus banquet or dining hall finishes service with 80 untouched meals, organizers face a
                terrifying exponential decay curve. Hot food must be collected, transported, and stored within 90 minutes.
              </p>

              <div className="mt-6 space-y-3.5">
                {[
                  {
                    title: "O(N²) Broadcast Chatter",
                    text: "Posting on WhatsApp generates dozens of fragmented threads, questions, and unanswered pings that devour the 90-minute window.",
                  },
                  {
                    title: "Phantom Volunteers & Ghosting",
                    text: "Informal promises provide false security. When a volunteer cancels at minute 75, there is zero time to find an alternative.",
                  },
                  {
                    title: "All-or-Nothing Quantities",
                    text: "A shelter with 20 beds cannot accept 80 meals; without fractional reservation, the entire batch goes to waste.",
                  },
                  {
                    title: "Zero Audit Verification",
                    text: "Without verified handovers, nobody knows what food reached people versus what ended up in landfill dumpsters.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <h4 className="font-serif font-bold text-rose-950 text-sm">{item.title}</h4>
                      <p className="text-xs text-rose-900/80 mt-0.5 leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Comparative Architecture Graph Card */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl border border-zen-border-strong bg-warm/30 p-6 sm:p-8 shadow-elevated">
                <div className="flex items-center justify-between border-b border-zen-border pb-4">
                  <span className="font-mono text-xs font-bold text-primary flex items-center gap-1.5">
                    <Cpu className="h-4 w-4" /> ENGINE ARCHITECTURE COMPARISON
                  </span>
                  <span className="rounded-full bg-primary-faint px-2.5 py-0.5 text-[10px] font-mono font-bold text-primary">
                    v2.4 KERNEL
                  </span>
                </div>

                <div className="mt-6 space-y-6">
                  {/* Top: Informal Channels */}
                  <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-subtle">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-rose-800">
                      <span>TRADITIONAL PHONE TREES</span>
                      <span className="text-rose-600">CHAOTIC & FRAGMENTED</span>
                    </div>
                    <div className="mt-3 font-mono text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                      <div className="text-rose-600">❌ WhatsApp broadcast: 42 recipients (Latency: +35 min)</div>
                      <div className="text-rose-600">❌ Uncoordinated concurrency: 2 drivers fight for 1 pickup</div>
                      <div className="text-rose-600">❌ Window timeout: Food discarded at landfill dock</div>
                    </div>
                  </div>

                  {/* Bottom: Get Fed Protocol */}
                  <div className="rounded-2xl border border-primary-soft bg-white p-5 shadow-soft">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-primary">
                      <span>GET FED ATOMIC PIPELINE</span>
                      <span className="text-emerald-700 font-bold">DETERMINISTIC & ZERO LOSS</span>
                    </div>
                    <div className="mt-3 font-mono text-xs text-slate-700 bg-primary-faint/30 p-3 rounded-xl border border-primary-soft/60 space-y-1">
                      <div className="text-primary font-semibold">✓ Ingestion: Structured payload published in &lt; 60s</div>
                      <div className="text-primary font-semibold">✓ Haversine Dispatch: 4 nearby verified recipients matched</div>
                      <div className="text-primary font-semibold">✓ Row Lock: Atomic partial allocation (25 of 60 reserved)</div>
                      <div className="text-primary font-semibold">✓ Proof: HMAC-signed QR scanned at kitchen dock in 1.4s</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 3 Engineering Pillars */}
      <section className="relative py-20 sm:py-28 border-t border-zen-border bg-page">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary">
              System Engineering
            </span>
            <h2 className="mt-3 text-3xl sm:text-5xl font-serif font-bold text-ink">
              The Three Pillars of <span className="text-primary italic font-serif">Algorithmic Integrity</span>
            </h2>
            <p className="mt-4 text-sm sm:text-base text-zen-muted leading-relaxed">
              Every millisecond of the Get Fed platform is built on transactional guarantees that protect donors,
              respect recipients, and ensure no edible meal is lost to coordination friction.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  data-cursor="PILLAR"
                  className="group relative flex flex-col justify-between rounded-3xl border border-zen-border-strong bg-white p-7 shadow-subtle hover:-translate-y-1 hover:border-primary-soft hover:shadow-soft transition-all duration-300"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-faint text-primary border border-primary-soft/60 group-hover:scale-105 transition-transform">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="font-mono text-xs font-bold text-primary bg-primary-faint/60 px-3 py-1 rounded-full">
                        PILLAR 0{idx + 1}
                      </span>
                    </div>

                    <h3 className="mt-6 text-xl font-serif font-bold text-ink">{pillar.title}</h3>
                    <div className="mt-1 text-xs font-mono font-semibold text-primary">{pillar.subtitle}</div>

                    <p className="mt-4 text-sm text-zen-muted leading-relaxed">{pillar.narrative}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zen-border space-y-2">
                    <div className="text-[11px] font-mono text-zen-faint">
                      <span className="text-zen-muted font-bold">Stack:</span> {pillar.tech}
                    </div>
                    <div className="text-xs font-mono font-bold text-primary">
                      ✓ {pillar.metric}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Institutional Trust & Ethics */}
      <section className="relative py-20 border-t border-zen-border bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-zen-border bg-surface-soft/60 p-8 sm:p-12 shadow-subtle">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary">
              Ethical Code & Privacy
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-serif font-bold text-ink">
              Dignity, Security & Zero Vanity Metrics
            </h2>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 text-sm text-zen-text leading-relaxed">
              <div className="rounded-2xl border border-zen-border bg-white p-5 shadow-subtle">
                <h4 className="font-serif font-bold text-ink text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Recipient Verification
                </h4>
                <p className="mt-2 text-xs text-zen-muted leading-relaxed">
                  Only accredited student groups, verified shelters, and documented community pantries can claim food.
                  Every organization is vetted by institutional campus administrators before permissions are granted.
                </p>
              </div>

              <div className="rounded-2xl border border-zen-border bg-white p-5 shadow-subtle">
                <h4 className="font-serif font-bold text-ink text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Real Impact Accounting
                </h4>
                <p className="mt-2 text-xs text-zen-muted leading-relaxed">
                  We measure verified handovers — meals actually collected and eaten. Food that went uncollected or was
                  expired is classified as operational waste to help kitchens optimize future banquet production.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-zen-border">
              <span className="text-xs font-mono text-zen-muted">
                Interested in deploying Get Fed across your campus or catering facility?
              </span>
              <Link
                href="/how-it-works"
                data-cursor="LIFECYCLE"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-semibold text-white shadow-subtle hover:bg-primary-hover transition-all"
              >
                <span>View Operational Lifecycle</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CinematicFooter />
    </div>
  );
}
