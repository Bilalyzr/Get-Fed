"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
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
  LayoutDashboard,
} from "lucide-react";
import { Logo } from "@/components/Logo";
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
    <div className="flex min-h-dvh flex-col bg-page text-zen-text font-sans antialiased selection:bg-primary-faint selection:text-ink">
      {/* ---------------------------------------------------------------- */}
      {/* Header */}
      {/* ---------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 border-b border-zen-border bg-page/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Get Fed home" className="transition-transform duration-200 hover:scale-[1.02]">
            <Logo size={36} withWordmark />
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Main">
            <Link
              href="/about"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-zen-muted transition-colors hover:bg-surface-soft hover:text-ink"
            >
              About
            </Link>
            <Link
              href="/how-it-works"
              className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-zen-muted transition-colors hover:bg-surface-soft hover:text-ink sm:inline-flex"
            >
              How it works
            </Link>

            {status === "authenticated" ? (
              <Link
                href={dashboardUrl}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover shadow-subtle"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg border border-zen-border bg-white px-3.5 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-surface-soft shadow-subtle"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover shadow-subtle"
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Hero */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24">
        {/* Subtle decorative background gradient */}
        <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center opacity-60">
          <div className="h-[480px] w-[640px] rounded-full bg-primary-faint/60 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-soft bg-primary-faint px-3.5 py-1 text-xs font-semibold tracking-wider text-primary uppercase">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            <span>Real-time Surplus Food Coordination</span>
          </div>

          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-serif font-bold tracking-tight text-ink sm:text-6xl sm:leading-[1.12]">
            Surplus food isn&apos;t wasted because nobody wants it.
            <span className="mt-3 block text-primary italic font-serif">
              It&apos;s wasted because nobody coordinates in time.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zen-muted sm:text-lg">
            Get Fed is a real-time allocation engine that connects institutions
            holding usable surplus with verified recipients — matching quantity,
            preparation time, pickup deadline and location before the food spoils.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={status === "authenticated" ? dashboardUrl : "/register"}
              className="flex items-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover shadow-subtle active:scale-[0.98]"
            >
              <span>{status === "authenticated" ? "Go to your dashboard" : "Publish surplus food"}</span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href={
                status === "authenticated"
                  ? role === "PROVIDER"
                    ? "/provider/listings"
                    : role === "RECIPIENT"
                    ? "/recipient/food"
                    : "/admin"
                  : "/register"
              }
              className="rounded-xl border border-zen-border bg-white px-7 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-soft shadow-subtle active:scale-[0.98]"
            >
              {status === "authenticated"
                ? role === "PROVIDER"
                  ? "Manage listings"
                  : role === "RECIPIENT"
                  ? "Find food to collect"
                  : "Admin workspace"
                : "Find food to collect"}
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
                className="rounded-2xl border border-zen-border bg-white p-4 sm:p-6 shadow-subtle transition-all hover:border-primary-soft hover:shadow-soft"
              >
                <dd className="text-2xl font-serif font-bold text-primary sm:text-4xl">
                  <CountUp value={stat.value} suffix={stat.suffix} duration={1.8} />
                </dd>
                <dt className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-zen-muted sm:text-xs">
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
      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">
        <section
          className="relative rounded-3xl border border-zen-border bg-surface-soft p-6 sm:p-10 shadow-subtle"
          aria-labelledby="scenario-title"
        >
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">
              01 · The Operational Challenge
            </div>
            <h2 id="scenario-title" className="mt-2 text-2xl font-serif font-bold text-ink sm:text-3xl">
              The <span className="text-primary italic font-serif">90-minute problem</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zen-text sm:text-base">
              A symposium planned for 300 attendees draws 240. At 2:00 PM the
              organiser finds <strong className="font-semibold text-primary">60 untouched meals</strong> —
              usable for barely 90 minutes. Phone trees and WhatsApp groups burn the whole
              window. Get Fed publishes the listing, matches nearby verified
              recipients, reserves exact quantities, and verifies handover with a QR
              scan — with time to spare.
            </p>
            <ul className="mt-6 grid gap-2.5 text-sm sm:grid-cols-2" role="list">
              {[
                "Listing published in under a minute",
                "Nearby recipients matched & notified",
                "Partial quantity claims — no overbooking",
                "Cancellations restore quantity automatically",
                "Expired listings vanish from discovery",
                "QR-verified collection & impact recorded",
              ].map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-2.5 rounded-xl border border-zen-border bg-white px-4 py-3 font-medium text-zen-text shadow-subtle"
                >
                  <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* Features */}
        {/* -------------------------------------------------------------- */}
        <section className="relative py-20" aria-labelledby="features-title">
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">
              02 · System Capabilities
            </div>
            <h2
              id="features-title"
              className="mt-2 text-center text-3xl font-serif font-bold tracking-tight text-ink sm:text-4xl"
            >
              Built for <span className="text-primary italic font-serif">coordination</span>, not just posting
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-zen-muted sm:text-base">
              Engineered with transactional integrity to eliminate coordination failure at every operational stage.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                index: "01",
                icon: Clock3,
                title: "Time engine",
                text: "Pickup deadlines, live countdowns and automatic expiry keep only valid food visible.",
              },
              {
                index: "02",
                icon: MapPin,
                title: "Location engine",
                text: "Browser geolocation, distance scoring and OpenStreetMap directions to every pickup point.",
              },
              {
                index: "03",
                icon: Scale,
                title: "Partial allocation",
                text: "Transactional quantity reservation — 60 meals can serve three recipients without ever overbooking.",
              },
              {
                index: "04",
                icon: QrCode,
                title: "Verified collection",
                text: "Cryptographically secure claim tokens, server-side QR verification, no double scans.",
              },
              {
                index: "05",
                icon: BellRing,
                title: "Smart notifications",
                text: "Rule-based matching ranks recipients by distance, quantity, time feasibility and reliability.",
              },
              {
                index: "06",
                icon: BarChart3,
                title: "Impact analytics",
                text: "Meals actually recovered is the north-star metric — measured, not guessed.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative flex h-full flex-col rounded-2xl border border-zen-border bg-white p-7 shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-soft hover:shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="inline-flex rounded-xl border border-primary-soft/50 bg-primary-faint p-3 text-primary"
                    aria-hidden
                  >
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs font-semibold text-zen-faint tracking-wider">
                    {feature.index}
                  </span>
                </div>
                <h3 className="mt-5 font-bold text-ink text-base">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zen-muted">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* Final CTA */}
        {/* -------------------------------------------------------------- */}
        <section className="relative pb-24 text-center">
          <div className="rounded-3xl border border-zen-border-strong bg-warm p-8 sm:p-14 shadow-soft">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">
              03 · Start A Conversation
            </div>
            <p className="mx-auto mt-3 max-w-xl text-balance text-2xl font-serif font-bold text-ink sm:text-3xl">
              <Utensils className="mr-2 inline h-6 w-6 text-primary" aria-hidden />
              Every meal worth saving is{" "}
              <span className="text-primary italic font-serif">a meal saved.</span>
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm text-zen-muted sm:text-base">
              Join organisations and communities reducing waste and ensuring good food reaches people in time.
            </p>
            <div className="mt-8">
              <Link
                href={status === "authenticated" ? dashboardUrl : "/register"}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover shadow-subtle active:scale-[0.98]"
              >
                <span>{status === "authenticated" ? "Go to your dashboard" : "Start coordinating — it's free"}</span>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zen-border bg-page py-10 text-center text-xs text-zen-muted">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <p>Get Fed — real-time surplus food coordination, verified end-to-end.</p>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/about" className="hover:text-ink">About</Link>
            <Link href="/how-it-works" className="hover:text-ink">How it works</Link>
            {status === "authenticated" ? (
              <Link href={dashboardUrl} className="hover:text-ink font-semibold text-primary">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="hover:text-ink">Sign in</Link>
                <Link href="/register" className="hover:text-ink">Register</Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
