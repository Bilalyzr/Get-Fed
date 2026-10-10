"use client";

import Link from "next/link";
import {
  Clock3,
  MapPin,
  Scale,
  QrCode,
  BellRing,
  BarChart3,
  ArrowRight,
  Utensils,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { CountUp } from "@/components/reactbits";

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-stone-950 text-stone-100">
      {/* ---------------------------------------------------------------- */}
      {/* Header */}
      {/* ---------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 border-b border-stone-800/80 bg-stone-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/" aria-label="Get Fed home">
            <Logo size={38} withWordmark />
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4" aria-label="Main">
            <Link
              href="/about"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-300 transition-colors hover:bg-stone-800 hover:text-white"
            >
              About
            </Link>
            <Link
              href="/how-it-works"
              className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-stone-300 transition-colors hover:bg-stone-800 hover:text-white sm:inline-flex"
            >
              How it works
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-stone-700 bg-stone-900/60 px-3.5 py-1.5 text-sm font-medium text-stone-200 transition-colors hover:bg-stone-800 hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-stone-950 transition-colors hover:bg-emerald-400 shadow-sm"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Hero */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            <span>REAL-TIME SURPLUS FOOD COORDINATION</span>
          </div>

          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-[1.12]">
            Surplus food isn&apos;t wasted because nobody wants it.
            <span className="mt-3 block text-emerald-400">
              It&apos;s wasted because nobody coordinates in time.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-stone-400 sm:text-lg">
            Get Fed is a real-time allocation engine that connects institutions
            holding usable surplus with verified recipients — matching quantity,
            preparation time, pickup deadline and location before the food spoils.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-7 py-3 text-sm font-bold text-stone-950 transition-colors hover:bg-emerald-400 shadow-sm"
            >
              <span>Publish surplus food</span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/register"
              className="rounded-xl border border-stone-700 bg-stone-900/70 px-7 py-3 text-sm font-semibold text-stone-200 transition-colors hover:bg-stone-800"
            >
              Find food to collect
            </Link>
          </div>

          {/* Impact counters */}
          <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-3 sm:gap-6">
            {[
              { label: "Pickup window", value: 90, suffix: " min" },
              { label: "Listing published in", value: 60, suffix: " sec" },
              { label: "Claim→QR verified", value: 100, suffix: "%" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-stone-800 bg-stone-900/60 p-4 sm:p-6"
              >
                <dd className="text-2xl font-extrabold text-emerald-400 sm:text-4xl">
                  <CountUp value={stat.value} suffix={stat.suffix} duration={1.8} />
                </dd>
                <dt className="mt-1 text-[11px] font-medium uppercase tracking-wide text-stone-400 sm:text-xs">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Scenario */}
      {/* ---------------------------------------------------------------- */}
      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4">
        <section
          className="relative -mt-2 rounded-3xl border border-stone-800 bg-stone-900/60 p-6 shadow-xl sm:p-10"
          aria-labelledby="scenario-title"
        >
          <div>
            <h2 id="scenario-title" className="text-xl font-extrabold text-white sm:text-2xl">
              The <span className="text-emerald-400">90-minute problem</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-stone-300 sm:text-base">
              A symposium planned for 300 attendees draws 240. At 2:00 PM the
              organiser finds <strong className="font-semibold text-emerald-400">60 untouched meals</strong> —
              usable for barely 90 minutes. Phone trees and WhatsApp groups burn the whole
              window. Get Fed publishes the listing, matches nearby verified
              recipients, reserves exact quantities, and verifies handover with a QR
              scan — with time to spare.
            </p>
            <ul className="mt-6 grid gap-2.5 text-sm text-stone-200 sm:grid-cols-2" role="list">
              {[
                "Listing published in under a minute",
                "Nearby recipients matched & notified",
                "Partial quantity claims — no overbooking",
                "Cancellations restore quantity automatically",
                "Expired listings vanish from discovery",
                "QR-verified collection & impact recorded",
              ].map((point) => (
                <li key={point} className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* Features */}
        {/* -------------------------------------------------------------- */}
        <section className="relative py-20" aria-labelledby="features-title">
          <h2
            id="features-title"
            className="text-center text-3xl font-extrabold tracking-tight text-white"
          >
            Built for <span className="text-emerald-400">coordination</span>, not just posting
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Clock3,
                title: "Time engine",
                text: "Pickup deadlines, live countdowns and automatic expiry keep only valid food visible.",
              },
              {
                icon: MapPin,
                title: "Location engine",
                text: "Browser geolocation, distance scoring and OpenStreetMap directions to every pickup point.",
              },
              {
                icon: Scale,
                title: "Partial allocation",
                text: "Transactional quantity reservation — 60 meals can serve three recipients without ever overbooking.",
              },
              {
                icon: QrCode,
                title: "Verified collection",
                text: "Cryptographically secure claim tokens, server-side QR verification, no double scans.",
              },
              {
                icon: BellRing,
                title: "Smart notifications",
                text: "Rule-based matching ranks recipients by distance, quantity, time feasibility and reliability.",
              },
              {
                icon: BarChart3,
                title: "Impact analytics",
                text: "Meals actually recovered is the north-star metric — measured, not guessed.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group h-full rounded-2xl border border-stone-800 bg-stone-900/50 p-6 transition-colors hover:border-stone-700 hover:bg-stone-900/80"
              >
                <span
                  className="inline-flex rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-400"
                  aria-hidden
                >
                  <feature.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-bold text-white">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-400">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* Final CTA */}
        {/* -------------------------------------------------------------- */}
        <section className="relative pb-24 text-center">
          <div className="rounded-3xl border border-stone-800 bg-stone-900/40 p-8 sm:p-12">
            <p className="mx-auto max-w-xl text-balance text-xl font-bold text-white sm:text-2xl">
              <Utensils className="mr-2 inline h-5 w-5 text-emerald-400" aria-hidden />
              Every meal worth saving is{" "}
              <span className="text-emerald-400">a meal saved.</span>
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm text-stone-400">
              Join organisations and communities reducing waste and ensuring good food reaches people in time.
            </p>
            <div className="mt-8">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-3.5 text-sm font-bold text-stone-950 transition-colors hover:bg-emerald-400 shadow-sm"
              >
                <span>Start coordinating — it&apos;s free</span>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-stone-800/80 bg-stone-950 py-8 text-center text-xs text-stone-500">
        <p>Get Fed — real-time surplus food coordination, verified end-to-end.</p>
      </footer>
    </div>
  );
}
