"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Clock3,
  MapPin,
  Scale,
  QrCode,
  BellRing,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Zap,
  CheckCircle2,
  Lock,
  Compass,
  Layers,
  Utensils,
  ChevronRight,
} from "lucide-react";
import { CustomCursor } from "@/components/cinematic/CustomCursor";
import { CinematicNavbar } from "@/components/cinematic/CinematicNavbar";
import { CinematicFooter } from "@/components/cinematic/CinematicFooter";
import { HeroDispatchRadar } from "@/components/cinematic/HeroDispatchRadar";
import { SurplusSimulator } from "@/components/cinematic/SurplusSimulator";
import { InteractiveClaimDemo } from "@/components/cinematic/InteractiveClaimDemo";
import { CountUp } from "@/components/reactbits";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const role = session?.user?.role;
  const dashboardUrl =
    role === "PROVIDER"
      ? "/provider/dashboard"
      : role === "ADMIN"
      ? "/admin"
      : "/recipient/dashboard";

  return (
    <div className="relative min-h-dvh flex flex-col bg-page text-zen-text font-sans antialiased selection:bg-primary-faint selection:text-ink overflow-x-hidden">
      {/* Custom dynamic cursor with magnetic physics */}
      <CustomCursor />

      {/* Floating Glassmorphic Header */}
      <CinematicNavbar />

      {/* ---------------------------------------------------------------- */}
      {/* Hero Section with Interactive 3D Canvas */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative pt-6 pb-20 sm:pt-12 sm:pb-28 overflow-hidden">
        {/* Ambient atmospheric backdrop */}
        <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center opacity-70">
          <div className="h-[600px] w-[800px] rounded-full bg-primary-faint/50 blur-[130px]" />
          <div className="absolute top-10 right-10 h-72 w-72 rounded-full bg-warm/60 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 items-center">
            {/* Left Hero Narrative */}
            <div className="lg:col-span-6 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full border border-primary-soft/60 bg-white/70 px-4 py-1.5 text-xs font-semibold tracking-wider text-primary uppercase shadow-subtle backdrop-blur-md"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Real-Time Surplus Allocation Engine</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-6 text-4xl sm:text-6xl lg:text-[3.8rem] font-serif font-bold tracking-tight text-ink leading-[1.12]"
              >
                Surplus food isn&apos;t wasted because nobody wants it.
                <span className="mt-3 block text-primary italic font-serif">
                  It&apos;s wasted because nobody coordinates in time.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-6 text-base sm:text-lg leading-relaxed text-zen-muted max-w-xl mx-auto lg:mx-0"
              >
                Get Fed is the real-time matching protocol connecting institutional surplus with verified recipients —
                calculating transit feasibility, locking atomic portions, and validating pickup before food spoils.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5"
              >
                <Link
                  href={status === "authenticated" ? dashboardUrl : "/register"}
                  data-cursor="GET STARTED"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-white shadow-soft hover:bg-primary-hover active:scale-[0.98] transition-all"
                >
                  <span>{status === "authenticated" ? "Enter your workspace" : "Publish surplus food"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/how-it-works"
                  data-cursor="EXPLORE"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-zen-border-strong bg-white/90 px-6 py-3.5 text-sm font-semibold text-ink shadow-subtle hover:bg-surface-soft active:scale-[0.98] transition-all"
                >
                  <span>See How It Works</span>
                  <ChevronRight className="h-4 w-4 text-zen-muted" />
                </Link>
              </motion.div>

              {/* Fast metric ticks */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-mono text-zen-muted border-t border-zen-border/70 pt-6"
              >
                <div className="flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4 text-primary" />
                  <span>&lt; 90m Window Enforcement</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-primary" />
                  <span>0% Overbooking Risk</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <QrCode className="h-4 w-4 text-primary" />
                  <span>100% Cryptographic QR Handshake</span>
                </div>
              </motion.div>
            </div>

            {/* Right: Live Interactive Campus Dispatch Radar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-6 relative"
            >
              <HeroDispatchRadar />
            </motion.div>
          </div>

          {/* Quick Real-Time Impact Counters Bar */}
          <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
            {[
              { label: "Active Pickup Window", value: 90, suffix: " min", sub: "Hard cutoff" },
              { label: "Listing Published In", value: 60, suffix: " sec", sub: "Zero friction" },
              { label: "Handover Verified", value: 100, suffix: "%", sub: "HMAC QR signed" },
              { label: "Allocation Accuracy", value: 100, suffix: "%", sub: "Row-locked ACID" },
            ].map((stat) => (
              <div
                key={stat.label}
                data-cursor="STAT"
                className="group relative overflow-hidden rounded-2xl border border-zen-border bg-white/90 p-5 shadow-subtle hover:border-primary-soft hover:shadow-soft transition-all duration-300"
              >
                <div className="text-2xl sm:text-4xl font-serif font-bold text-primary">
                  <CountUp value={stat.value} suffix={stat.suffix} duration={1.6} />
                </div>
                <div className="mt-1 text-xs font-bold text-ink">{stat.label}</div>
                <div className="mt-0.5 text-[11px] font-mono text-zen-muted uppercase tracking-wider">
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Interactive 90-Minute Crisis Simulator Lab */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative py-16 sm:py-24 bg-surface-soft/40 border-y border-zen-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SurplusSimulator />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Core Protocol Capabilities (3D Depth Grid) */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative py-20 sm:py-28" aria-labelledby="engines-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-soft bg-primary-faint/60 px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-primary">
              <Layers className="h-3.5 w-3.5" /> Core Architecture
            </span>
            <h2 id="engines-title" className="mt-4 text-3xl sm:text-5xl font-serif font-bold text-ink">
              Built for <span className="text-primary italic font-serif">deterministic coordination</span>, not passive listings
            </h2>
            <p className="mt-4 text-base text-zen-muted leading-relaxed">
              Standard bulletin boards fail under time pressure. Get Fed is engineered with six transactional engines
              that guarantee every portion is accounted for, routed in time, and verified at handover.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                index: "01",
                icon: Clock3,
                title: "Perishability Time Engine",
                desc: "Live countdown clocks, hard pickup expiration boundaries, and automatic listing eviction. When food nears safety limits, priorities escalate automatically.",
                badge: "Strict Cutoff",
              },
              {
                index: "02",
                icon: MapPin,
                title: "Haversine Geofence Engine",
                desc: "Calculates precise road distances and estimated courier travel time to prevent impossible claims. Only recipients capable of arriving before deadline are matched.",
                badge: "< 5km Geofence",
              },
              {
                index: "03",
                icon: Scale,
                title: "Atomic Row-Level Allocation",
                desc: "Multiple recipients can claim subsets of a large surplus batch without concurrency collisions. Our ACID row locks eliminate overbooking forever.",
                badge: "ACID Guaranteed",
              },
              {
                index: "04",
                icon: QrCode,
                title: "Cryptographic QR Handshake",
                desc: "Recipients receive unique cryptographically signed tokens. Providers scan them directly at pickup docks to complete physical verification in under 2 seconds.",
                badge: "Anti-Tamper",
              },
              {
                index: "05",
                icon: BellRing,
                title: "Targeted Push Dispatch",
                desc: "Direct push payloads route to verified organizations ranked by capacity and past collection reliability. No spam, no chaotic WhatsApp group chatter.",
                badge: "Zero Spam",
              },
              {
                index: "06",
                icon: BarChart3,
                title: "Verified Impact Ledger",
                desc: "Our north-star metric is strictly verified meals collected, not food advertised. Real-time CO2 avoidance and meal counts sync to institutional sustainability dashboards.",
                badge: "Audit-Grade",
              },
            ].map((eng) => (
              <div
                key={eng.title}
                data-cursor="ENGINE"
                className="group relative flex flex-col justify-between rounded-3xl border border-zen-border bg-white p-7 shadow-subtle hover:-translate-y-1 hover:border-primary-soft hover:shadow-soft transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-faint text-primary border border-primary-soft/60 group-hover:scale-105 transition-transform">
                      <eng.icon className="h-6 w-6" />
                    </span>
                    <span className="font-mono text-xs font-bold text-zen-muted bg-surface-soft px-2.5 py-1 rounded-full">
                      {eng.badge}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-serif font-bold text-ink">{eng.title}</h3>
                  <p className="mt-2.5 text-sm text-zen-muted leading-relaxed">{eng.desc}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-zen-border/70 flex items-center justify-between text-xs font-mono text-primary font-bold">
                  <span>SUBSYSTEM {eng.index}</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Live Interactive Claim & QR Sandbox */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative py-16 sm:py-24 bg-warm/30 border-t border-zen-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <InteractiveClaimDemo />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Institutional Network & Community Trust */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative py-20 sm:py-24 border-t border-zen-border bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary">
              Institutional Network
            </span>
            <h2 className="mt-2 text-3xl font-serif font-bold text-ink">
              Trusted by campus dining halls, host kitchens & verified pantries
            </h2>
            <p className="mt-3 text-sm text-zen-muted">
              Built to meet university compliance, food hygiene standards, and municipal zero-waste mandates.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { type: "Campus Canteens", role: "Surplus Provider", desc: "Batch meal listings in 60s" },
              { type: "Youth Shelters", role: "Verified Recipient", desc: "Instant meal collection" },
              { type: "Hostel Kitchens", role: "Surplus Provider", desc: "Daily evening surplus" },
              { type: "Community Pantries", role: "Verified Recipient", desc: "Local neighborhood drop" },
            ].map((node) => (
              <div
                key={node.type}
                className="rounded-2xl border border-zen-border bg-page/60 p-5 text-center shadow-subtle hover:border-primary-soft transition-colors"
              >
                <div className="text-xs font-mono font-bold uppercase text-primary">{node.role}</div>
                <div className="mt-1 font-serif text-lg font-bold text-ink">{node.type}</div>
                <p className="mt-1 text-xs text-zen-muted">{node.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Cinematic Final CTA */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative py-20 sm:py-28 overflow-hidden bg-page">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative rounded-3xl border border-zen-border-strong bg-warm p-8 sm:p-16 shadow-elevated overflow-hidden">
            {/* Ambient gold-emerald glow */}
            <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-primary-faint/60 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-soft bg-primary-faint px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-primary">
                <Utensils className="h-3.5 w-3.5" /> Start Saving Meals Today
              </span>

              <h2 className="mt-4 text-3xl sm:text-5xl font-serif font-bold text-ink leading-tight">
                Every meal worth saving is{" "}
                <span className="text-primary italic font-serif">a meal saved.</span>
              </h2>

              <p className="mt-4 text-base text-zen-muted max-w-xl mx-auto leading-relaxed">
                Connect your dining hall, cafeteria, or community organization to the real-time food rescue network.
                Zero subscription fees for verified community partners.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href={status === "authenticated" ? dashboardUrl : "/register"}
                  data-cursor="START FREE"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-sm font-semibold text-white shadow-soft hover:bg-primary-hover active:scale-[0.98] transition-all"
                >
                  <span>{status === "authenticated" ? "Go to your workspace" : "Get started — it's free"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/about"
                  data-cursor="ABOUT"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-zen-border-strong bg-white px-7 py-4 text-sm font-semibold text-ink shadow-subtle hover:bg-surface-soft active:scale-[0.98] transition-all"
                >
                  <span>Read Architecture Manifesto</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cinematic Footer */}
      <CinematicFooter />
    </div>
  );
}
