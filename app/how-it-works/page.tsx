"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight, CheckCircle2, ShieldAlert, LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/Logo";
import { BackButton } from "@/components/BackButton";
import { Aurora, DotGrid, FadeContent, CountUp } from "@/components/reactbits";

const STEPS = [
  {
    title: "Surplus identified",
    text: "An event ends early or a canteen over-caters. The provider opens the app and creates a listing in under a minute: food, quantity, prepared time, pickup deadline and location.",
  },
  {
    title: "Listing validated & published",
    text: "The backend validates quantity and deadlines, then publishes the listing as AVAILABLE. The matching engine immediately scores nearby verified recipients by distance, quantity fit, time feasibility and reliability.",
  },
  {
    title: "Recipients notified",
    text: "Best-matched recipients receive notifications with quantity and deadline. Discovery shows live countdowns and distances — expired listings never appear.",
  },
  {
    title: "Claim & reserve",
    text: "A recipient claims exactly the quantity they can use — even a partial one. A database transaction with row-level locking reserves it instantly; concurrent claims can never overbook.",
  },
  {
    title: "QR-verified pickup",
    text: "The recipient receives a secure QR code. At the pickup point, the provider scans it; the server validates the token, claim, listing and deadline before marking the claim COLLECTED.",
  },
  {
    title: "Impact recorded",
    text: "Meals recovered update instantly on dashboards. The north-star metric is successfully collected surplus quantity — real food, really saved.",
  },
];

export default function HowItWorksPage() {
  const { data: session, status } = useSession();
  const role = session?.user?.role;
  const dashboardUrl =
    role === "PROVIDER"
      ? "/provider/dashboard"
      : role === "ADMIN"
      ? "/admin"
      : "/recipient/dashboard";

  return (
    <div className="relative min-h-dvh overflow-hidden bg-page text-zen-text font-sans antialiased selection:bg-primary-faint selection:text-ink">
      <Aurora className="opacity-30" />
      <DotGrid dotColor="rgba(101,146,135,0.12)" size={26} />

      <header className="sticky top-0 z-40 border-b border-zen-border bg-page/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Get Fed home" className="transition-transform duration-200 hover:scale-[1.02]">
            <Logo size={36} withWordmark />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/about"
              className="text-sm font-medium text-zen-muted transition-colors hover:text-ink"
            >
              About
            </Link>
            {status === "authenticated" ? (
              <Link
                href={dashboardUrl}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover shadow-subtle"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-lg border border-zen-border bg-white px-3.5 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-surface-soft shadow-subtle"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-6 flex justify-start">
          <BackButton fallbackHref="/" label="Back to home" />
        </div>
        <FadeContent>
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">
            02 · Operational Lifecycle
          </div>
          <h1 className="mt-3 text-3xl font-serif font-bold tracking-tight text-ink sm:text-5xl">
            How it <span className="text-primary italic font-serif">works</span>
          </h1>
          <p className="mt-3 text-base leading-relaxed text-zen-muted sm:text-lg">
            From surplus discovery to verified collection in six steps — the complete
            lifecycle runs on verified transactional logic.
          </p>
        </FadeContent>

        <ol className="relative mt-10 space-y-4" role="list">
          {STEPS.map((step, index) => (
            <FadeContent key={step.title} delay={index * 0.06}>
              <li className="flex gap-4 rounded-2xl border border-zen-border bg-white p-5 sm:p-6 shadow-subtle transition-all duration-200 hover:border-primary-soft hover:shadow-soft">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary-soft/60 bg-primary-faint text-sm font-bold text-primary font-mono"
                  aria-hidden
                >
                  0{index + 1}
                </span>
                <div>
                  <h2 className="font-serif text-lg font-bold text-ink">{step.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-zen-muted">{step.text}</p>
                </div>
              </li>
            </FadeContent>
          ))}
        </ol>

        <FadeContent delay={0.2}>
          <div className="mt-8 rounded-2xl border border-zen-border bg-surface-soft p-6 sm:p-7 shadow-subtle">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-lg font-bold text-ink">Safety rules always enforced</h2>
            </div>
            <ul className="mt-3 grid gap-2 text-sm text-zen-text sm:grid-cols-2" role="list">
              {[
                "Expired food can never be claimed.",
                "Cancelled claims can never be scanned.",
                "Collected claims can never be collected twice.",
                "Claim quantity can never exceed availability.",
                "Only verified recipients can claim.",
                "Providers can never claim their own listings.",
              ].map((rule) => (
                <li key={rule} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </FadeContent>

        <FadeContent delay={0.3}>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { label: "Steps end-to-end", value: 6 },
              { label: "Business rules", value: 10 },
              { label: "Edge cases tested", value: 10 },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-zen-border bg-white p-4 text-center shadow-subtle">
                <p className="text-2xl font-serif font-bold text-primary sm:text-3xl">
                  <CountUp value={stat.value} duration={1.2} />
                </p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-zen-muted">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4 pt-4 border-t border-zen-border">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover shadow-subtle active:scale-[0.98]"
            >
              <span>Start coordinating — it&apos;s free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-zen-border bg-white px-7 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-soft shadow-subtle"
            >
              Sign in to your account
            </Link>
          </div>
        </FadeContent>
      </main>

      <footer className="border-t border-zen-border bg-page py-8 text-center text-xs text-zen-muted">
        <p>Get Fed — real-time surplus food coordination, verified end-to-end.</p>
      </footer>
    </div>
  );
}
