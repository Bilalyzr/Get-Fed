"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Aurora, DotGrid, GradientText, FadeContent, CountUp } from "@/components/reactbits";

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
            How it{" "}
            <GradientText colors={["#a3e635", "#4ade80", "#a3e635"]}>works</GradientText>
          </h1>
          <p className="mt-3 leading-relaxed text-stone-300">
            From surplus to verified collection in six steps — the complete
            lifecycle runs on real database state, never manual coordination.
          </p>
        </FadeContent>

        <ol className="relative mt-10 space-y-4" role="list">
          {STEPS.map((step, index) => (
            <FadeContent key={step.title} delay={index * 0.08}>
              <li className="glass-dark flex gap-4 rounded-2xl border border-white/10 p-5 transition-colors hover:border-lime-400/25">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-lime-400 to-emerald-600 text-sm font-bold text-emerald-950 shadow-lg shadow-emerald-900/40"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <div>
                  <h2 className="font-bold text-white">{step.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-stone-300">{step.text}</p>
                </div>
              </li>
            </FadeContent>
          ))}
        </ol>

        <FadeContent delay={0.2}>
          <div className="glass-dark mt-8 rounded-2xl border border-lime-400/20 bg-lime-400/[0.04] p-5">
            <h2 className="font-bold text-lime-300">Safety rules always enforced</h2>
            <ul className="mt-2 space-y-1 text-sm text-stone-300" role="list">
              <li>• Expired food can never be claimed.</li>
              <li>• Cancelled claims can never be scanned.</li>
              <li>• Collected claims can never be collected twice.</li>
              <li>• Claim quantity can never exceed availability.</li>
              <li>• Only verified recipients can claim.</li>
              <li>• Providers can never claim their own listings.</li>
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
              <div key={stat.label} className="glass-dark rounded-xl border border-white/10 p-3 text-center">
                <p className="text-xl font-extrabold text-lime-300 sm:text-2xl">
                  <CountUp value={stat.value} duration={1.2} />
                </p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-lime-400/10 px-5 py-2.5 text-sm font-bold text-lime-300 ring-1 ring-lime-400/30 transition-colors hover:bg-lime-400/20"
          >
            Start coordinating →
          </Link>
        </FadeContent>
      </div>
    </div>
  );
}
