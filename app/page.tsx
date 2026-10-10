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
import {
  Aurora,
  Particles,
  DotGrid,
  GradientText,
  SplitText,
  ShinyText,
  DecryptedText,
  CountUp,
  StarBorder,
  FadeContent,
  Magnet,
} from "@/components/reactbits";

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-stone-950 text-stone-100">
      {/* ---------------------------------------------------------------- */}
      {/* Header */}
      {/* ---------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-stone-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/" aria-label="Get Fed home">
            <Logo size={38} withWordmark />
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4" aria-label="Main">
            <Link href="/about" className="btn-ghost !text-stone-300 text-sm hover:!bg-white/10">
              About
            </Link>
            <Link
              href="/how-it-works"
              className="btn-ghost hidden !text-stone-300 text-sm hover:!bg-white/10 sm:inline-flex"
            >
              How it works
            </Link>
            <Link href="/login" className="btn-secondary text-sm">
              Sign in
            </Link>
            <StarBorder color="#4ade80" speed="5s">
              <Link
                href="/register"
                className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-lime-100 transition-colors hover:text-white"
              >
                <ShinyText speed={3.5}>Get started</ShinyText>
              </Link>
            </StarBorder>
          </nav>
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Hero — Aurora + Particles + animated headline */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden">
        <Aurora />
        <Particles color="#86efac" density={0.00006} />
        <DotGrid dotColor="rgba(163,230,53,0.14)" size={26} />

        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
          <FadeContent>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-lime-400/25 bg-lime-400/10 px-4 py-1.5 text-xs font-medium text-lime-200">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              <DecryptedText text="REAL-TIME SURPLUS FOOD COORDINATION" speed={28} />
            </p>
          </FadeContent>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl">
            <SplitText text="Surplus food isn't wasted because" className="block" delay={28} />
            <SplitText text="nobody wants it." className="block" delay={45} />
            <span className="mt-2 block">
              <GradientText
                className="text-4xl font-extrabold tracking-tight sm:text-6xl"
                colors={["#a3e635", "#4ade80", "#22d3ee", "#a3e635"]}
                animationSpeed={7}
              >
                It&apos;s wasted because nobody coordinates in time.
              </GradientText>
            </span>
          </h1>

          <FadeContent delay={0.35}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-stone-400 sm:text-lg">
              Get Fed is a real-time allocation engine that connects
              institutions holding usable surplus with verified recipients —
              matching quantity, preparation time, pickup deadline and location
              before the food spoils.
            </p>
          </FadeContent>

          <FadeContent delay={0.55}>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Magnet strength={0.25}>
                <StarBorder color="#a3e635" speed="4s">
                  <Link
                    href="/register"
                    className="flex items-center gap-2 px-7 py-3 text-sm font-bold text-lime-50 transition-colors hover:text-white"
                  >
                    <ShinyText speed={3}>Publish surplus food</ShinyText>
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </StarBorder>
              </Magnet>
              <Link
                href="/register"
                className="btn rounded-xl border border-white/15 bg-white/5 px-7 py-3 text-sm font-semibold text-stone-200 backdrop-blur transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-400"
              >
                Find food to collect
              </Link>
            </div>
          </FadeContent>

          {/* Impact counters */}
          <FadeContent delay={0.75}>
            <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-3 sm:gap-6">
              {[
                { label: "Pickup window", value: 90, suffix: " min" },
                { label: "Listing published in", value: 60, suffix: " sec" },
                { label: "Claim→QR verified", value: 100, suffix: "%" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="glass-dark rounded-2xl border border-white/10 p-4 sm:p-6"
                >
                  <dd className="text-2xl font-extrabold text-lime-300 sm:text-4xl">
                    <CountUp value={stat.value} suffix={stat.suffix} duration={1.8} />
                  </dd>
                  <dt className="mt-1 text-[11px] font-medium uppercase tracking-wide text-stone-400 sm:text-xs">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>
          </FadeContent>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Scenario */}
      {/* ---------------------------------------------------------------- */}
      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4">
        <FadeContent blur>
          <section
            className="glass-dark relative -mt-2 rounded-3xl border border-white/10 p-6 shadow-2xl shadow-emerald-950/50 sm:p-10"
            aria-labelledby="scenario-title"
          >
            <DotGrid dotColor="rgba(163,230,53,0.1)" size={30} />
            <div className="relative">
              <h2 id="scenario-title" className="text-xl font-extrabold text-white sm:text-2xl">
                The{" "}
                <GradientText colors={["#a3e635", "#4ade80", "#a3e635"]}>
                  90-minute problem
                </GradientText>
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-stone-300 sm:text-base">
                A symposium planned for 300 attendees draws 240. At 2:00 PM the
                organiser finds <strong className="text-lime-300">60 untouched meals</strong> —
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
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-lime-400" aria-hidden />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </FadeContent>

        {/* -------------------------------------------------------------- */}
        {/* Features */}
        {/* -------------------------------------------------------------- */}
        <section className="relative py-20" aria-labelledby="features-title">
          <DotGrid dotColor="rgba(74,222,128,0.12)" size={24} />
          <FadeContent>
            <h2
              id="features-title"
              className="relative text-center text-3xl font-extrabold tracking-tight text-white"
            >
              Built for{" "}
              <GradientText colors={["#4ade80", "#a3e635", "#4ade80"]}>
                coordination
              </GradientText>
              , not just posting
            </h2>
          </FadeContent>
          <div className="relative mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            ].map((feature, index) => (
              <FadeContent key={feature.title} delay={index * 0.08}>
                <div className="card-hover-sheen group h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition-colors hover:border-lime-400/30 hover:bg-white/[0.07]">
                  <span
                    className="inline-flex rounded-xl bg-gradient-to-br from-lime-400/25 to-emerald-500/10 p-3 text-lime-300 ring-1 ring-lime-400/25 transition-transform duration-300 group-hover:scale-110"
                    aria-hidden
                  >
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-bold text-white">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-stone-400">{feature.text}</p>
                </div>
              </FadeContent>
            ))}
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* Final CTA */}
        {/* -------------------------------------------------------------- */}
        <section className="relative pb-24 text-center">
          <Aurora className="opacity-60" />
          <FadeContent>
            <div className="relative">
              <p className="mx-auto max-w-xl text-balance text-xl font-bold text-white sm:text-2xl">
                <Utensils className="mr-2 inline h-5 w-5 text-lime-400" aria-hidden />
                Every meal worth saving is{" "}
                <GradientText colors={["#a3e635", "#4ade80", "#a3e635"]}>
                  a meal saved.
                </GradientText>
              </p>
              <Magnet strength={0.2} className="mt-8">
                <StarBorder color="#a3e635" speed="4s">
                  <Link
                    href="/register"
                    className="flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-lime-50 transition-colors hover:text-white"
                  >
                    <ShinyText speed={3}>Start coordinating — it&apos;s free</ShinyText>
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </StarBorder>
              </Magnet>
            </div>
          </FadeContent>
        </section>
      </main>

      <footer className="relative border-t border-white/5 bg-stone-950 py-8 text-center text-xs text-stone-500">
        <p>Get Fed — real-time surplus food coordination, verified end-to-end.</p>
      </footer>
    </div>
  );
}
