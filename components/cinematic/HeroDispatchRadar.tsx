"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  MapPin,
  ShieldCheck,
  Zap,
  Sparkles,
  CheckCircle2,
  Utensils,
  ChevronRight,
  Radio,
  Flame,
  Layers,
} from "lucide-react";

interface ListingNode {
  id: string;
  provider: string;
  location: string;
  foodName: string;
  meals: number;
  initialSeconds: number;
  dietary: string;
  distance: string;
  matchedRecipient: string;
  avatarColor: string;
}

const SAMPLE_LISTINGS: ListingNode[] = [
  {
    id: "lst-1",
    provider: "Faculty Dining Hall",
    location: "Campus North Wing · Dock 3",
    foodName: "Artisanal Warm Bowls & Roasted Greens",
    meals: 45,
    initialSeconds: 2745, // ~45 min
    dietary: "Vegetarian · Warm Packed",
    distance: "0.8 km away",
    matchedRecipient: "Hope Community Shelter",
    avatarColor: "bg-emerald-600",
  },
  {
    id: "lst-2",
    provider: "Student Union Canteen",
    location: "Central Campus · Service Level 1",
    foodName: "Mediterranean Herb Rice & Braised Protein",
    meals: 60,
    initialSeconds: 4120, // ~68 min
    dietary: "Halal Certified · Insulated",
    distance: "1.4 km away",
    matchedRecipient: "Youth Cooperative Kitchen",
    avatarColor: "bg-amber-600",
  },
  {
    id: "lst-3",
    provider: "Campus Artisan Bakery",
    location: "South Gate Culinary Lab",
    foodName: "Fresh Baguettes, Croissants & Brioche",
    meals: 28,
    initialSeconds: 1530, // ~25 min
    dietary: "Freshly Baked · Dry Packed",
    distance: "0.4 km away",
    matchedRecipient: "St. Jude Evening Pantry",
    avatarColor: "bg-orange-600",
  },
];

export function HeroDispatchRadar() {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"radar" | "dispatch">("radar");
  const [matched, setMatched] = useState<boolean>(false);
  const [matchingInProgress, setMatchingInProgress] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(SAMPLE_LISTINGS[0].initialSeconds);

  // Live ticking countdown
  useEffect(() => {
    setSecondsLeft(SAMPLE_LISTINGS[selectedIdx].initialSeconds);
    setMatched(false);
  }, [selectedIdx]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSimulateMatch = () => {
    setMatchingInProgress(true);
    setTimeout(() => {
      setMatchingInProgress(false);
      setMatched(true);
    }, 800);
  };

  const current = SAMPLE_LISTINGS[selectedIdx];

  return (
    <div
      data-cursor="RADAR"
      className="relative w-full rounded-3xl border border-zen-border-strong bg-white/80 p-5 sm:p-7 shadow-elevated backdrop-blur-xl overflow-hidden"
    >
      {/* Background ambient radar glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary-faint/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-warm/50 blur-3xl" />

      {/* Terminal Top Bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-zen-border pb-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
          <span className="font-mono text-xs font-bold text-ink uppercase tracking-wider">
            Campus Surplus Radar
          </span>
          <span className="rounded-full bg-primary-faint px-2 py-0.5 text-[10px] font-mono font-bold text-primary">
            LIVE SCAN
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 rounded-xl bg-surface-soft/60 p-1 border border-zen-border text-xs font-semibold">
          <button
            onClick={() => setActiveTab("radar")}
            className={`rounded-lg px-2.5 py-1 transition-all ${
              activeTab === "radar" ? "bg-white text-ink shadow-subtle" : "text-zen-muted hover:text-ink"
            }`}
          >
            Radar Map
          </button>
          <button
            onClick={() => setActiveTab("dispatch")}
            className={`rounded-lg px-2.5 py-1 transition-all ${
              activeTab === "dispatch" ? "bg-white text-ink shadow-subtle" : "text-zen-muted hover:text-ink"
            }`}
          >
            Feed ({SAMPLE_LISTINGS.length})
          </button>
        </div>
      </div>

      {/* Radar Map & Visual Dispatch View */}
      {activeTab === "radar" ? (
        <div className="relative z-10 mt-5">
          {/* Radar Screen Area */}
          <div className="relative h-56 sm:h-64 w-full rounded-2xl bg-gradient-to-b from-[#132214] to-[#0c180d] p-4 overflow-hidden border border-primary/30 flex items-center justify-center">
            {/* Concentric grid circles */}
            <div className="absolute h-48 w-48 rounded-full border border-emerald-500/20" />
            <div className="absolute h-36 w-36 rounded-full border border-emerald-500/25" />
            <div className="absolute h-24 w-24 rounded-full border border-emerald-500/30" />
            <div className="absolute h-12 w-12 rounded-full border border-emerald-500/40" />
            {/* Crosshairs */}
            <div className="absolute h-full w-[1px] bg-emerald-500/15" />
            <div className="absolute w-full h-[1px] bg-emerald-500/15" />

            {/* Rotating radar sweep beam */}
            <div
              className="absolute inset-0 origin-center pointer-events-none animate-spin"
              style={{
                animationDuration: "4s",
                animationTimingFunction: "linear",
                background:
                  "conic-gradient(from 0deg, rgba(48, 109, 41, 0.45) 0deg, rgba(48, 109, 41, 0) 60deg, transparent 60deg)",
              }}
            />

            {/* Radar Center Coordinate Node */}
            <div className="relative z-10 flex flex-col items-center">
              <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
              <span className="text-[9px] font-mono font-bold text-emerald-300 mt-1 uppercase tracking-wider bg-black/50 px-1.5 py-0.5 rounded">
                Get Fed Hub
              </span>
            </div>

            {/* Floating Blips for the 3 Listings */}
            {/* Blip 1: North Wing */}
            <button
              onClick={() => setSelectedIdx(0)}
              className={`absolute top-8 left-16 z-20 group transition-transform ${
                selectedIdx === 0 ? "scale-125" : "hover:scale-110"
              }`}
            >
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border border-white"></span>
              </span>
              <span className="absolute -bottom-5 -left-8 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-mono text-emerald-200">
                45 meals · 0.8km
              </span>
            </button>

            {/* Blip 2: Central Canteen */}
            <button
              onClick={() => setSelectedIdx(1)}
              className={`absolute bottom-10 right-14 z-20 group transition-transform ${
                selectedIdx === 1 ? "scale-125" : "hover:scale-110"
              }`}
            >
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border border-white"></span>
              </span>
              <span className="absolute -top-5 -left-8 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-mono text-amber-200">
                60 meals · 1.4km
              </span>
            </button>

            {/* Blip 3: Bakery Lab */}
            <button
              onClick={() => setSelectedIdx(2)}
              className={`absolute top-12 right-20 z-20 group transition-transform ${
                selectedIdx === 2 ? "scale-125" : "hover:scale-110"
              }`}
            >
              <span className="relative flex h-3.5 w-3.5">
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-orange-400 border border-white"></span>
              </span>
              <span className="absolute -bottom-5 -left-6 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-mono text-orange-200">
                28 meals · 0.4km
              </span>
            </button>
          </div>

          {/* Selected Listing Detail Card below Radar */}
          <div className="mt-4 rounded-2xl border border-zen-border bg-page/70 p-4 shadow-subtle">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-bold">
                  {current.provider}
                </span>
                <h4 className="font-serif text-base font-bold text-ink mt-0.5">{current.foodName}</h4>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zen-muted">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary" /> {current.location}
                  </span>
                  <span className="font-mono text-primary font-bold">{current.distance}</span>
                </div>
              </div>

              {/* Countdown Ticker */}
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end font-mono text-lg font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                  <Clock className="h-3.5 w-3.5 text-rose-600 animate-pulse" />
                  <span>{formatTimer(secondsLeft)}</span>
                </div>
                <span className="block text-[10px] font-mono text-zen-muted uppercase mt-0.5">
                  Pickup Cutoff
                </span>
              </div>
            </div>

            {/* Live Match Bar */}
            <div className="mt-4 pt-3 border-t border-zen-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-ink">{current.meals} Meals Ready</span>
                <span className="text-zen-faint">·</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-zen-muted border border-zen-border">
                  {current.dietary}
                </span>
              </div>

              {!matched ? (
                <button
                  onClick={handleSimulateMatch}
                  disabled={matchingInProgress}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-subtle hover:bg-primary-hover active:scale-95 transition-all disabled:opacity-50"
                >
                  {matchingInProgress ? (
                    <Zap className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Zap className="h-3.5 w-3.5" />
                  )}
                  <span>{matchingInProgress ? "Calculating Route..." : "Trigger Live Match"}</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Matched to {current.matchedRecipient}!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Dispatch Feed List View */
        <div className="relative z-10 mt-5 space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {SAMPLE_LISTINGS.map((listing, idx) => {
            const isSelected = idx === selectedIdx;
            return (
              <button
                key={listing.id}
                onClick={() => {
                  setSelectedIdx(idx);
                  setActiveTab("radar");
                }}
                className={`w-full text-left rounded-2xl p-3.5 border transition-all ${
                  isSelected
                    ? "border-primary bg-primary-faint/30 shadow-subtle"
                    : "border-zen-border bg-page/60 hover:border-primary-soft hover:bg-page"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">{listing.provider}</span>
                  <span className="text-xs font-mono font-bold text-primary">{listing.meals} meals</span>
                </div>
                <div className="mt-1 text-xs text-zen-muted truncate">{listing.foodName}</div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-zen-muted">
                  <span>{listing.distance}</span>
                  <span className="text-rose-700 font-bold">Expires in ~{Math.floor(listing.initialSeconds / 60)}m</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom Real-Time Telemetry Bar */}
      <div className="relative z-10 mt-5 pt-4 border-t border-zen-border flex items-center justify-between text-[11px] font-mono text-zen-muted">
        <div className="flex items-center gap-1.5">
          <Radio className="h-3.5 w-3.5 text-primary animate-pulse" />
          <span>ALGORITHM SLA: 42s AVERAGE MATCH</span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span>CAMPUS GEOFENCE: 2.8 KM</span>
          <span className="text-zen-faint">|</span>
          <span className="text-primary font-bold">100% SECURE</span>
        </div>
      </div>
    </div>
  );
}
