"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, AlertTriangle, CheckCircle2, Trash2, ShieldCheck, Zap, Flame } from "lucide-react";

interface Milestone {
  minute: number;
  label: string;
  traditional: {
    status: string;
    details: string;
    temperature: string;
    wasteRisk: number; // percentage
  };
  getFed: {
    status: string;
    details: string;
    allocated: number; // out of 60
    verified: boolean;
  };
}

const MILESTONES: Milestone[] = [
  {
    minute: 0,
    label: "00:00 · Surplus Discovered",
    traditional: {
      status: "Discovery Delay",
      details: "Symposium draws 240 instead of 300. 60 gourmet buffet boxes boxed up. Organizers ponder who to call.",
      temperature: "68°C (Peak Freshness)",
      wasteRisk: 10,
    },
    getFed: {
      status: "Instant 60s Listing",
      details: "Organizer snaps photo, enters 60 meals, set 90m cutoff. Geolocation coordinates anchored instantly.",
      allocated: 0,
      verified: false,
    },
  },
  {
    minute: 20,
    label: "20:00 · Broadcast Friction",
    traditional: {
      status: "WhatsApp Clutter",
      details: "Sent to 3 group chats. 14 confused replies: 'Can you deliver?', 'Halal?', 'How many boxes?'. Time slips away.",
      temperature: "58°C (Cooling)",
      wasteRisk: 35,
    },
    getFed: {
      status: "Algorithmic Geo-Match",
      details: "Engine matches 4 verified recipients within 2.8km. Push notifications delivered with exact food specs.",
      allocated: 35,
      verified: false,
    },
  },
  {
    minute: 45,
    label: "45:00 · Coordination Breakdown",
    traditional: {
      status: "False Hope & Deadlocks",
      details: "Volunteer says they'll try to reach by 3:30. Nobody knows if anyone else is coming. Kitchen staff wants to lock up.",
      temperature: "45°C (Safety Threshold)",
      wasteRisk: 65,
    },
    getFed: {
      status: "Atomic Row-Level Reservation",
      details: "Hope Shelter claims 35, Student Co-op claims 25. Inventory hits 0 with atomic row locking. Both couriers en route.",
      allocated: 60,
      verified: false,
    },
  },
  {
    minute: 70,
    label: "70:00 · Last-Mile Failure",
    traditional: {
      status: "No-Show & Ghosting",
      details: "Volunteer messages: 'Stuck in traffic, can't make it'. No backup plan. Boxes stacked by service door.",
      temperature: "32°C (Bacterial Window)",
      wasteRisk: 88,
    },
    getFed: {
      status: "Cryptographic QR Handshake",
      details: "Both couriers arrive at canteen dock. Organizer scans dynamic QR codes in 1.4 seconds. Claims marked COLLECTED.",
      allocated: 60,
      verified: true,
    },
  },
  {
    minute: 90,
    label: "90:00 · The Verdict",
    traditional: {
      status: "Dumped in Landfill",
      details: "Sanitation protocols trigger. 60 untouched gourmet meals tossed into dumpsters. 100% loss.",
      temperature: "Spoiled / Non-compliant",
      wasteRisk: 100,
    },
    getFed: {
      status: "100% Recovered & Logged",
      details: "60 meals served across 2 dining rooms. Verified impact receipt minted. 150kg CO2 emission prevented.",
      allocated: 60,
      verified: true,
    },
  },
];

export function SurplusSimulator() {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentIdx((prev) => {
          if (prev >= MILESTONES.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 3400);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const current = MILESTONES[currentIdx];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-zen-border-strong bg-white p-5 sm:p-8 md:p-10 shadow-soft">
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary-faint/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-warm/40 blur-3xl" />

      {/* Header controls */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zen-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-ping" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary">
              Interactive 90-Minute Crisis Lab
            </span>
          </div>
          <h3 className="mt-1 text-2xl sm:text-3xl font-serif font-bold text-ink">
            The Anatomy of a <span className="text-primary italic font-serif">Rescue vs Waste</span>
          </h3>
          <p className="mt-1 text-sm text-zen-muted">
            Drag the scrub bar or run the simulation to see why standard channels collapse while Get Fed thrives.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            data-cursor="PLAY"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-subtle hover:bg-primary-hover active:scale-95 transition-all"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span>{isPlaying ? "Pause Timeline" : "Simulate 90-Min Decay"}</span>
          </button>
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentIdx(0);
            }}
            title="Reset simulation"
            className="rounded-xl border border-zen-border bg-page p-2.5 text-zen-muted hover:text-ink hover:bg-surface-soft active:scale-95 transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Timeline Scrub Controls */}
      <div className="relative z-10 mt-8">
        <div className="flex justify-between items-center mb-2 text-xs font-mono font-bold text-zen-muted">
          <span>00m (START)</span>
          <span className="text-primary font-bold text-sm bg-primary-faint/60 px-3 py-0.5 rounded-full border border-primary-soft/50">
            {current.label}
          </span>
          <span>90m (EXPIRY)</span>
        </div>

        {/* Stepper bar */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {MILESTONES.map((m, idx) => {
            const isActive = idx === currentIdx;
            const isPassed = idx < currentIdx;
            return (
              <button
                key={m.minute}
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentIdx(idx);
                }}
                data-cursor={`T+${m.minute}m`}
                className={`group relative flex flex-col items-center justify-center rounded-xl py-2.5 px-2 text-left transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-subtle ring-2 ring-primary ring-offset-2"
                    : isPassed
                    ? "bg-primary-faint/50 text-primary border border-primary-soft/40 hover:bg-primary-faint"
                    : "bg-surface-soft/60 text-zen-muted border border-zen-border hover:bg-surface-soft"
                }`}
              >
                <span className="font-mono text-xs font-bold sm:text-sm">+{m.minute}m</span>
                <span className="hidden sm:inline-block text-[10px] truncate max-w-full font-medium opacity-80 mt-0.5">
                  {m.label.split("·")[1]?.trim()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Parallel Comparison Tracks */}
      <div className="relative z-10 mt-8 grid gap-6 md:grid-cols-2">
        {/* Track 1: WhatsApp / Phone Tree */}
        <motion.div
          key={`trad-${currentIdx}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="relative flex flex-col justify-between rounded-2xl border border-rose-200 bg-rose-50/40 p-6 backdrop-blur-sm"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-rose-800">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                Conventional Phone & WhatsApp Trees
              </span>
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-rose-700">
                Risk: {current.traditional.wasteRisk}%
              </span>
            </div>

            <h4 className="mt-4 text-lg font-serif font-bold text-rose-950">
              {current.traditional.status}
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-rose-900/80">
              {current.traditional.details}
            </p>
          </div>

          <div className="mt-6 border-t border-rose-200/80 pt-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-rose-800/80 flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-amber-600" /> Food Safety:
              </span>
              <span className="font-bold text-rose-950">{current.traditional.temperature}</span>
            </div>

            {/* Waste Risk Bar */}
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-rose-200">
              <div
                className="h-full bg-rose-600 transition-all duration-500 ease-out"
                style={{ width: `${current.traditional.wasteRisk}%` }}
              />
            </div>
            {current.minute === 90 && (
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-rose-700">
                <Trash2 className="h-4 w-4" />
                <span>Result: 60 meals in campus dumpster</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Track 2: Get Fed Atomic Engine */}
        <motion.div
          key={`gf-${currentIdx}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="relative flex flex-col justify-between rounded-2xl border border-primary-soft bg-primary-faint/30 p-6 backdrop-blur-sm shadow-subtle"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-primary">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Get Fed Real-Time Engine
              </span>
              <span className="rounded-full bg-primary px-2.5 py-0.5 font-mono text-[11px] font-bold text-white shadow-subtle">
                {current.getFed.verified ? "100% RECOVERED" : `${current.getFed.allocated}/60 RESERVED`}
              </span>
            </div>

            <h4 className="mt-4 text-lg font-serif font-bold text-ink">
              {current.getFed.status}
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-zen-text">
              {current.getFed.details}
            </p>
          </div>

          <div className="mt-6 border-t border-primary-soft/40 pt-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-primary font-semibold flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-primary" /> Meal Allocation Progress:
              </span>
              <span className="font-bold text-ink">{current.getFed.allocated} of 60 Meals</span>
            </div>

            {/* Allocation Bar */}
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-primary-faint">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${(current.getFed.allocated / 60) * 100}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs font-mono">
              <span className="text-zen-muted">Verification state:</span>
              <span className="inline-flex items-center gap-1 font-bold text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {current.getFed.verified ? "QR Claim Verified" : "Row Lock Active"}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
