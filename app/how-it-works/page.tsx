"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Clock,
  MapPin,
  QrCode,
  Scale,
  Users,
  Building,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { CustomCursor } from "@/components/cinematic/CustomCursor";
import { CinematicNavbar } from "@/components/cinematic/CinematicNavbar";
import { CinematicFooter } from "@/components/cinematic/CinematicFooter";
import { InteractiveLifecycleWalkthrough } from "@/components/cinematic/InteractiveLifecycleWalkthrough";

export default function HowItWorksPage() {
  const { data: session, status } = useSession();
  const [activeRoleTab, setActiveRoleTab] = useState<"provider" | "recipient" | "admin">("provider");

  const roleWorkflows = {
    provider: {
      title: "Campus Dining & Caterers (Surplus Providers)",
      subtitle: "From leftover banquet to verified collection in under 4 minutes of effort",
      steps: [
        {
          num: "01",
          title: "Snap & Log (< 60s)",
          desc: "Enter portion quantity, meal classification, food temperature status, and hard pickup deadline.",
        },
        {
          num: "02",
          title: "Monitor Live Matches",
          desc: "Watch the engine automatically evaluate nearby recipient organizations and lock portions atomically.",
        },
        {
          num: "03",
          title: "1-Tap Camera Scan",
          desc: "When the verified courier arrives at the kitchen dock, scan their dynamic QR token to complete handover.",
        },
        {
          num: "04",
          title: "Automated Impact Audit",
          desc: "Review your verified meals rescued, CO2 offset metrics, and municipal waste reduction certificates.",
        },
      ],
    },
    recipient: {
      title: "Shelters, Pantries & Student Cooperatives (Recipients)",
      subtitle: "Predictable, high-quality nourishment with guaranteed quantity and zero overbooking",
      steps: [
        {
          num: "01",
          title: "Get Priority Geo-Alerts",
          desc: "Receive deterministic push alerts when edible surplus appears within your team's transit radius.",
        },
        {
          num: "02",
          title: "Claim Exact Portion Size",
          desc: "Take only what your organization can refrigerate or distribute (e.g., 20 out of 50 available meals).",
        },
        {
          num: "03",
          title: "Dynamic QR Token",
          desc: "Access your cryptographically signed claim token on mobile with turn-by-turn routing to the kitchen dock.",
        },
        {
          num: "04",
          title: "Verified Community Nourishment",
          desc: "Show token at handover dock; food status marks COLLECTED instantly on public and campus ledgers.",
        },
      ],
    },
    admin: {
      title: "Campus Sustainability & Compliance Officers (Admins)",
      subtitle: "Full institutional transparency, accreditation controls, and ESG data exports",
      steps: [
        {
          num: "01",
          title: "Vet & Approve Organizations",
          desc: "Review nonprofit tax IDs, hygiene certifications, and cold-storage capabilities before granting claim access.",
        },
        {
          num: "02",
          title: "Live Campus Telemetry",
          desc: "Track real-time active surplus pools across all campus canteens, catering hubs, and student centers.",
        },
        {
          num: "03",
          title: "Automated Expiry & Safety Audits",
          desc: "System background cron jobs evict expired listings and flag uncollected claims for protocol review.",
        },
        {
          num: "04",
          title: "ESG & Zero-Waste Reporting",
          desc: "Generate certified greenhouse gas avoidance and meal distribution reports for institutional accreditation.",
        },
      ],
    },
  };

  const activeWorkflow = roleWorkflows[activeRoleTab];

  return (
    <div className="relative min-h-dvh flex flex-col bg-page text-zen-text font-sans antialiased selection:bg-primary-faint selection:text-ink overflow-x-hidden">
      <CustomCursor />
      <CinematicNavbar />

      {/* Header */}
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
            <span>Operational Lifecycle</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-4xl sm:text-6xl font-serif font-bold tracking-tight text-ink leading-[1.12]"
          >
            How it <span className="text-primary italic font-serif">works</span> in practice
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed text-zen-muted"
          >
            From the moment the banquet ends to the verified physical exchange, explore how the Get Fed protocol
            coordinates every operational stage with zero room for error.
          </motion.p>
        </div>
      </section>

      {/* 6-Stage Interactive Console Walkthrough */}
      <section className="relative py-12 sm:py-20 border-t border-zen-border bg-page">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary">
              Full Protocol Sequence
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-serif font-bold text-ink">
              The 6-Phase Transactional Journey
            </h2>
            <p className="mt-3 text-sm text-zen-muted">
              Select any stage below to inspect the real-time operational logic, latency SLA, and server execution telemetry.
            </p>
          </div>

          <InteractiveLifecycleWalkthrough />
        </div>
      </section>

      {/* Role-Specific Workflows Tabs */}
      <section className="relative py-20 border-t border-zen-border bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary">
              Ecosystem Roles
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-serif font-bold text-ink">
              Tailored for every stakeholder
            </h2>
            <p className="mt-3 text-sm text-zen-muted">
              Whether you generate surplus, distribute it to people, or oversee university compliance.
            </p>

            {/* Role switch tabs */}
            <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-zen-border bg-surface-soft/60 p-1.5 shadow-subtle">
              {[
                { id: "provider", label: "For Providers", icon: Building },
                { id: "recipient", label: "For Recipients", icon: Users },
                { id: "admin", label: "For Campus Admins", icon: ShieldCheck },
              ].map((tab) => {
                const isActive = activeRoleTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveRoleTab(tab.id as any)}
                    data-cursor={tab.label.toUpperCase()}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-subtle"
                        : "text-zen-muted hover:text-ink hover:bg-white"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Workflow Cards */}
          <div className="mt-12">
            <div className="text-center mb-8">
              <h3 className="font-serif text-2xl font-bold text-ink">{activeWorkflow.title}</h3>
              <p className="text-xs font-mono text-zen-muted mt-1">{activeWorkflow.subtitle}</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {activeWorkflow.steps.map((st) => (
                <div
                  key={st.num}
                  className="rounded-3xl border border-zen-border bg-page/50 p-6 shadow-subtle hover:border-primary-soft hover:shadow-soft transition-all duration-300"
                >
                  <span className="font-mono text-xs font-bold text-primary bg-primary-faint px-2.5 py-1 rounded-lg">
                    STEP {st.num}
                  </span>
                  <h4 className="mt-4 font-serif text-lg font-bold text-ink">{st.title}</h4>
                  <p className="mt-2 text-xs text-zen-muted leading-relaxed">{st.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Integrity Inviolable Rules */}
      <section className="relative py-20 border-t border-zen-border bg-page">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-zen-border-strong bg-warm/30 p-8 sm:p-12 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-faint text-primary border border-primary-soft">
                <ShieldAlert className="h-6 w-6 text-primary" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                  Inviolable System Safety Rules
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-ink">
                  Guaranteed by Server Validation & Database Constraints
                </h3>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs text-zen-text">
              {[
                {
                  rule: "Zero Expired Food Claims",
                  desc: "When current time exceeds pickup deadline, claims are blocked at database level.",
                },
                {
                  rule: "Strict Anti-Overbooking",
                  desc: "Serializable row locks prevent race conditions; claim quantities never exceed available stock.",
                },
                {
                  rule: "Cryptographic Single-Use QR",
                  desc: "Tokens cannot be duplicated or double-scanned once claim status reaches COLLECTED.",
                },
                {
                  rule: "Automatic Inventory Reversion",
                  desc: "If a claim is cancelled by recipient, the reserved count instantly returns to active pool.",
                },
                {
                  rule: "Zero Self-Claiming",
                  desc: "Providers are mathematically blocked from claiming their own published surplus.",
                },
                {
                  rule: "Mandatory Admin Vetting",
                  desc: "Only recipient accounts with verified status approved by campus admins can place claims.",
                },
              ].map((item) => (
                <div key={item.rule} className="rounded-2xl border border-zen-border bg-white p-4 shadow-subtle">
                  <div className="flex items-center gap-2 font-bold text-ink font-serif text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>{item.rule}</span>
                  </div>
                  <p className="mt-1.5 text-zen-muted leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-zen-border">
              <span className="text-xs font-mono text-zen-muted">
                Ready to experience the platform live?
              </span>
              <div className="flex items-center gap-3">
                <Link
                  href="/register"
                  data-cursor="JOIN"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-semibold text-white shadow-subtle hover:bg-primary-hover transition-all"
                >
                  <span>Start coordinating — it&apos;s free</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/login"
                  data-cursor="LOGIN"
                  className="inline-flex items-center gap-2 rounded-xl border border-zen-border bg-white px-5 py-3 text-xs font-semibold text-ink shadow-subtle hover:bg-surface-soft transition-all"
                >
                  <span>Sign in</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CinematicFooter />
    </div>
  );
}
