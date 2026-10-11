"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight, ShieldCheck, CheckCircle2, LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/Logo";
import { BackButton } from "@/components/BackButton";
import { Aurora, DotGrid, FadeContent } from "@/components/reactbits";

export default function AboutPage() {
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
              href="/how-it-works"
              className="text-sm font-medium text-zen-muted transition-colors hover:text-ink"
            >
              How it works
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
            Our Purpose & Architecture
          </div>
          <h1 className="mt-3 text-3xl font-serif font-bold tracking-tight text-ink sm:text-5xl">
            About the platform
          </h1>
          <p className="mt-4 text-base leading-relaxed text-zen-muted sm:text-lg">
            Technology designed to make coordination friction disappear before time-sensitive food goes to waste.
          </p>
        </FadeContent>

        <FadeContent delay={0.12}>
          <div className="mt-8 space-y-6 leading-relaxed text-zen-text">
            <p className="text-base sm:text-lg leading-relaxed">
              Get Fed is a{" "}
              <strong className="font-semibold text-primary">
                real-time allocation and coordination engine for time-sensitive surplus food
              </strong>
              . It connects college canteens, campus events, hostel kitchens and
              institutional dining — places where surplus reliably appears — with
              verified recipient organisations that can collect it before the
              pickup window expires.
            </p>

            <div className="rounded-2xl border border-zen-border bg-surface-soft p-6 sm:p-7 shadow-subtle">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
                The Root Problem
              </h2>
              <p className="mt-2 text-sm text-zen-text leading-relaxed sm:text-base">
                Most surplus goes to waste for coordination reasons, not
                willingness reasons: the surplus is discovered late, potential
                recipients are not immediately known, quantities are unclear,
                deadlines are fuzzy, multiple groups claim the same food, and
                nobody verifies what was actually collected. This platform solves
                that complete loop.
              </p>
            </div>

            <div className="grid gap-5 pt-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-zen-border bg-white p-6 shadow-subtle">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <h2 className="font-serif text-lg text-ink font-bold">What makes it different</h2>
                </div>
                <p className="mt-3 text-sm text-zen-muted leading-relaxed">
                  A donation-posting website lists food. Get Fed <strong className="font-semibold text-primary">coordinates</strong> it:
                  time, location, quantity, recipient eligibility, matching, partial allocation,
                  cancellation recovery, expiry, verified pickup and impact measurement — every stage enforced server-side.
                </p>
              </div>

              <div className="rounded-2xl border border-zen-border bg-white p-6 shadow-subtle">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h2 className="font-serif text-lg text-ink font-bold">Built for trust</h2>
                </div>
                <p className="mt-3 text-sm text-zen-muted leading-relaxed">
                  Every recipient organisation is verified by an administrator before it can claim. Every claim is a database transaction
                  that cannot overbook inventory. Every collection is verified with a cryptographically secured QR token.
                </p>
              </div>
            </div>
          </div>
        </FadeContent>

        <FadeContent delay={0.25}>
          <div className="mt-10 flex flex-wrap items-center gap-4 pt-4 border-t border-zen-border">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover shadow-subtle active:scale-[0.98]"
            >
              <span>See how it works</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl border border-zen-border bg-white px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-soft shadow-subtle"
            >
              Get started free
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
