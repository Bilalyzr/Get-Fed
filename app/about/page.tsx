"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Aurora, DotGrid, GradientText, FadeContent } from "@/components/reactbits";

export default function AboutPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-stone-950 text-stone-100">
      <Aurora className="opacity-60" />
      <DotGrid dotColor="rgba(74,222,128,0.12)" size={26} />

      <div className="relative mx-auto max-w-3xl px-4 py-12">
        <Link href="/" aria-label="Food Worth Saving home" className="inline-block">
          <Logo size={40} withWordmark />
        </Link>
        <FadeContent>
          <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            About{" "}
            <GradientText colors={["#a3e635", "#4ade80", "#a3e635"]}>
              the platform
            </GradientText>
          </h1>
        </FadeContent>
        <FadeContent delay={0.15}>
          <div className="mt-6 space-y-5 leading-relaxed text-stone-300">
            <p>
              Food Worth Saving is a{" "}
              <strong className="text-lime-300">
                real-time allocation and coordination engine for time-sensitive
                surplus food
              </strong>
              . It connects college canteens, campus events, hostel kitchens and
              institutional dining — places where surplus reliably appears — with
              verified recipient organisations that can collect it before the
              pickup window expires.
            </p>
            <p>
              Most surplus goes to waste for coordination reasons, not
              willingness reasons: the surplus is discovered late, potential
              recipients are not immediately known, quantities are unclear,
              deadlines are fuzzy, multiple groups claim the same food, and
              nobody verifies what was actually collected. This platform solves
              that complete loop.
            </p>
            <h2 className="pt-2 text-xl font-bold text-white">What makes it different</h2>
            <p>
              A donation-posting website lists food. Food Worth Saving{" "}
              <strong className="text-lime-300">coordinates</strong> it: time,
              location, quantity, recipient eligibility, matching, partial
              allocation, cancellation recovery, expiry, verified pickup and
              impact measurement — every stage enforced server-side.
            </p>
            <h2 className="pt-2 text-xl font-bold text-white">Built for trust</h2>
            <p>
              Every recipient organisation is verified by an administrator before
              it can claim. Every claim is a database transaction that cannot
              overbook inventory. Every collection is verified with a
              cryptographically secured QR token scanned by the provider. Every
              critical action is written to an audit log.
            </p>
          </div>
        </FadeContent>
        <FadeContent delay={0.3}>
          <Link
            href="/how-it-works"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-lime-400/10 px-5 py-2.5 text-sm font-bold text-lime-300 ring-1 ring-lime-400/30 transition-colors hover:bg-lime-400/20"
          >
            See how it works →
          </Link>
        </FadeContent>
      </div>
    </div>
  );
}
