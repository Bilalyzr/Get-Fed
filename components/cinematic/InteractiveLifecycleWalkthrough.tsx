"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Clock,
  MapPin,
  QrCode,
  Scale,
  BellRing,
  ArrowRight,
  Database,
  Terminal,
  Zap,
} from "lucide-react";

interface Stage {
  number: string;
  name: string;
  shortDesc: string;
  sla: string;
  icon: any;
  headline: string;
  narrative: string;
  telemetry: {
    statusBadge: string;
    lockStatus: string;
    serverLog: string[];
    safetyGuarantee: string;
  };
}

const STAGES: Stage[] = [
  {
    number: "01",
    name: "Surplus Identification",
    shortDesc: "60-second rapid listing",
    sla: "< 60 seconds to publish",
    icon: Sparkles,
    headline: "Zero-Friction Ingestion at the Source",
    narrative:
      "When a campus dining hall, caterer, or hostel ends service with unconsumed prepared food, seconds matter. The provider inputs 4 critical attributes: food type, portion count, exact preparation timestamp, and absolute pickup expiration deadline. Real-time geo-coordinates are anchored automatically.",
    telemetry: {
      statusBadge: "PENDING_VERIFICATION",
      lockStatus: "IDLE",
      serverLog: [
        "POST /api/listings [HTTP 201 Created]",
        "PAYLOAD: { meals: 60, expires_in: '90m', temp: 'safe' }",
        "STATUS_MUTATION: Listing -> AVAILABLE",
      ],
      safetyGuarantee: "Invalid quantities or negative expiration windows are rejected at API boundary by Zod schema.",
    },
  },
  {
    number: "02",
    name: "Algorithmic Geo-Scoring",
    shortDesc: "Instant recipient ranking",
    sla: "< 250ms query latency",
    icon: MapPin,
    headline: "Prioritized Proximity & Capacity Rerouting",
    narrative:
      "The Get Fed dispatch engine calculates a composite match index across verified recipient organizations within a 5km radius. The scoring formula weights physical transit time, verified refrigeration capacity, historical collection reliability, and quantity appetite.",
    telemetry: {
      statusBadge: "AVAILABLE",
      lockStatus: "UNLOCKED",
      serverLog: [
        "MATCH_DISPATCH: Querying verified recipients in radius=5.0km",
        "EVAL: Recipient 'Hope Shelter' (dist=1.4km, reliability=99.2%) -> score=0.96",
        "EVAL: Recipient 'Youth Hub' (dist=2.8km, reliability=96.5%) -> score=0.89",
      ],
      safetyGuarantee: "Only organizations pre-vetted by campus administration receive high-priority alerts.",
    },
  },
  {
    number: "03",
    name: "Targeted Push Dispatch",
    shortDesc: "No broadcast spam",
    sla: "Zero phone tree latency",
    icon: BellRing,
    headline: "Direct Feasibility Feeds without Noise",
    narrative:
      "Unlike chaotic WhatsApp groups where messages get lost in conversation, Get Fed sends deterministic high-priority push payloads. Recipient dispatchers see immediate route feasibility, meal temperature classification, allergen data, and live ticking countdown clocks.",
    telemetry: {
      statusBadge: "ACTIVE_DISCOVERY",
      lockStatus: "BROADCASTED",
      serverLog: [
        "SOCKET_BROADCAST: Emitting 'listing:new' to authenticated room",
        "DISPATCH_NOTIFY: Webhook pushed to 3 candidate recipient terminals",
        "CLIENT_ACK: Hope Shelter dispatcher opened listing detail (t+12s)",
      ],
      safetyGuarantee: "Expired listings immediately evaporate from active discovery feeds across all devices.",
    },
  },
  {
    number: "04",
    name: "Atomic Row-Level Reservation",
    shortDesc: "Zero double-booking",
    sla: "Strict serializable ACID",
    icon: Scale,
    headline: "Partial Claims with Mathematical Certainty",
    narrative:
      "A recipient can claim whatever portion they can actually distribute (e.g. 25 of 60 meals). A database transaction with strict row-level locking (`SELECT ... FOR UPDATE`) reserves the portion and decrements available inventory atomically. Concurrent clicks never result in overbooking.",
    telemetry: {
      statusBadge: "PARTIALLY_RESERVED",
      lockStatus: "EXCLUSIVE_ROW_LOCK_ACQUIRED",
      serverLog: [
        "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;",
        "UPDATE listings SET reserved = reserved + 25 WHERE id = $1;",
        "INSERT INTO claims (quantity=25, status='RESERVED');",
        "COMMIT TRANSACTION [Latency: 42ms];",
      ],
      safetyGuarantee: "If a claim is aborted or cancelled before pickup, the quantity automatically reverts to inventory.",
    },
  },
  {
    number: "05",
    name: "Cryptographic QR Handshake",
    shortDesc: "Physical proof of handover",
    sla: "< 2.0s physical handover scan",
    icon: QrCode,
    headline: "Zero-Trust Physical Exchange Protocol",
    narrative:
      "Upon claim reservation, the recipient's device receives an HMAC-signed dynamic QR token. At the campus kitchen dock, the donor scans this token with their mobile camera. The server validates token signature, matching claim ID, provider identity, and window validity.",
    telemetry: {
      statusBadge: "COLLECTED",
      lockStatus: "CLAIM_LOCKED_FINAL",
      serverLog: [
        "SCAN_POST /api/claims/scan { token_hash: '0x8f9a2b...' }",
        "CRYPTO_VERIFY: HMAC-SHA256 signature match confirmed",
        "CHECK_TIMESTAMP: Current time < expiration deadline (34m remaining)",
        "MUTATE: Claim status -> COLLECTED",
      ],
      safetyGuarantee: "QR tokens cannot be double-scanned, forwarded, or reused once the transaction settles.",
    },
  },
  {
    number: "06",
    name: "Immutable Impact Ledger",
    shortDesc: "Verified meals saved metric",
    sla: "Zero vanity metrics",
    icon: ShieldCheck,
    headline: "Audit-Grade Environmental Accounting",
    narrative:
      "Unlike platforms that celebrate 'food posted', Get Fed's north-star metric is strictly 'food collected and consumed'. The completed transaction logs real-time meal counts, CO2 offset metrics, and methane avoidance data directly to public and institutional sustainability dashboards.",
    telemetry: {
      statusBadge: "IMPACT_VERIFIED",
      lockStatus: "AUDIT_LOGGED",
      serverLog: [
        "ANALYTICS_EMIT: +25 meals recorded to campus sustainability ledger",
        "METRIC_COMPUTE: Estimated 62.5kg CO2e emissions avoided",
        "DASHBOARD_SYNC: Aggregates refreshed for Provider and Recipient",
      ],
      safetyGuarantee: "Cancelled or expired listings are recorded as operational waste to pinpoint supply chain friction.",
    },
  },
];

export function InteractiveLifecycleWalkthrough() {
  const [activeStageIdx, setActiveStageIdx] = useState(0);

  const stage = STAGES[activeStageIdx];
  const Icon = stage.icon;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-zen-border-strong bg-white shadow-soft">
      {/* Top stage progression tabs */}
      <div className="border-b border-zen-border bg-page/40 p-3 sm:p-4 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          {STAGES.map((s, idx) => {
            const isActive = idx === activeStageIdx;
            return (
              <button
                key={s.number}
                onClick={() => setActiveStageIdx(idx)}
                data-cursor={`STEP ${s.number}`}
                className={`group flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-mono font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-subtle"
                    : "bg-white text-zen-muted border border-zen-border hover:border-primary-soft hover:text-ink"
                }`}
              >
                <span className={`h-5 w-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-surface-soft text-primary"
                }`}>
                  {s.number}
                </span>
                <span>{s.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main interactive stage console */}
      <div className="p-6 sm:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={stage.number}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="grid gap-8 lg:grid-cols-12"
          >
            {/* Left: Narrative & Architecture */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-faint text-primary border border-primary-soft">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                      Phase {stage.number} · {stage.shortDesc}
                    </div>
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
                      {stage.headline}
                    </h3>
                  </div>
                </div>

                <p className="mt-5 text-sm sm:text-base leading-relaxed text-zen-muted">
                  {stage.narrative}
                </p>

                {/* Safety Guarantee Callout */}
                <div className="mt-6 rounded-2xl border border-primary-soft/60 bg-primary-faint/30 p-4">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                    <div>
                      <span className="text-xs font-mono font-bold uppercase text-primary">
                        System Safety Guarantee
                      </span>
                      <p className="mt-0.5 text-xs text-zen-text leading-relaxed">
                        {stage.telemetry.safetyGuarantee}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stepper buttons */}
              <div className="mt-8 flex items-center justify-between border-t border-zen-border pt-4">
                <button
                  disabled={activeStageIdx === 0}
                  onClick={() => setActiveStageIdx((prev) => Math.max(0, prev - 1))}
                  className="rounded-xl border border-zen-border bg-page px-4 py-2 text-xs font-semibold text-zen-muted hover:text-ink hover:bg-surface-soft disabled:opacity-40 disabled:pointer-events-none transition-all"
                >
                  Previous Phase
                </button>

                <span className="text-xs font-mono text-zen-faint">
                  {activeStageIdx + 1} of {STAGES.length}
                </span>

                <button
                  disabled={activeStageIdx === STAGES.length - 1}
                  onClick={() => setActiveStageIdx((prev) => Math.min(STAGES.length - 1, prev + 1))}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-subtle hover:bg-primary-hover disabled:opacity-40 disabled:pointer-events-none transition-all"
                >
                  <span>Next Phase</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Right: Live Telemetry Terminal */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-zen-border-strong bg-[#0f1712] p-5 text-slate-100 font-mono text-xs shadow-elevated">
                {/* Terminal top bar */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold tracking-wider">
                    SYS_STAGE_{stage.number}
                  </span>
                </div>

                {/* State badges */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded-lg bg-white/5 p-2 border border-white/10">
                    <span className="text-slate-400 block">STATE:</span>
                    <span className="text-emerald-400 font-bold">{stage.telemetry.statusBadge}</span>
                  </div>
                  <div className="rounded-lg bg-white/5 p-2 border border-white/10">
                    <span className="text-slate-400 block">LOCK ENGINE:</span>
                    <span className="text-amber-300 font-bold truncate block">{stage.telemetry.lockStatus}</span>
                  </div>
                </div>

                <div className="mt-3 rounded-lg bg-white/5 p-2 border border-white/10 text-[10px]">
                  <span className="text-slate-400 block">TARGET LATENCY SLA:</span>
                  <span className="text-emerald-300 font-bold">{stage.sla}</span>
                </div>

                {/* Server log terminal stream */}
                <div className="mt-4 space-y-1.5 text-[11px] font-mono leading-relaxed">
                  <div className="text-emerald-500 flex items-center gap-1">
                    <Terminal className="h-3 w-3" />
                    <span>KERNEL EXECUTION LOG:</span>
                  </div>
                  {stage.telemetry.serverLog.map((log, i) => (
                    <div key={i} className="text-slate-300 pl-2 border-l border-emerald-500/40">
                      <span className="text-emerald-500/70 mr-1.5">$</span>
                      {log}
                    </div>
                  ))}
                </div>

                <div className="mt-5 border-t border-white/10 pt-3 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Zap className="h-3 w-3" /> Transaction Verified
                  </span>
                  <span>SHA256: 9e4f..8b1c</span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
