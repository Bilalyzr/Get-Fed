"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  ArrowRight,
  Sparkles,
  Menu,
  X,
  Compass,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/Logo";

export function CinematicNavbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = session?.user?.role;
  const dashboardUrl =
    role === "PROVIDER"
      ? "/provider/dashboard"
      : role === "ADMIN"
      ? "/admin"
      : "/recipient/dashboard";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/how-it-works", label: "How It Works" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "border-b border-zen-border-strong/80 bg-page/90 backdrop-blur-xl shadow-subtle py-2.5"
          : "border-b border-transparent bg-transparent py-4"
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand logo */}
        <div className="flex items-center">
          <Link
            href="/"
            data-cursor="HOME"
            aria-label="Get Fed home"
            className="group flex items-center gap-3 transition-transform duration-200 hover:scale-[1.02]"
          >
            <Logo size={36} withWordmark />
          </Link>
        </div>

        {/* Center desktop navigation */}
        <nav
          className="hidden md:flex items-center gap-1 rounded-full border border-zen-border bg-white/70 p-1.5 shadow-subtle backdrop-blur-md"
          aria-label="Main"
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                data-cursor={link.label.toUpperCase()}
                className={`relative rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-subtle"
                    : "text-zen-muted hover:text-ink hover:bg-surface-soft/80"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side CTA & session */}
        <div className="hidden md:flex items-center gap-3">
          {status === "authenticated" ? (
            <Link
              href={dashboardUrl}
              data-cursor="DASHBOARD"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-subtle hover:bg-primary-hover active:scale-95 transition-all"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Workspace</span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                data-cursor="SIGN IN"
                className="rounded-xl border border-zen-border bg-white/80 px-4 py-2 text-xs font-semibold text-ink shadow-subtle hover:bg-surface-soft active:scale-95 transition-all"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                data-cursor="JOIN"
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-subtle hover:bg-primary-hover active:scale-95 transition-all"
              >
                <span>Get started</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="rounded-xl border border-zen-border bg-white/80 p-2 text-zen-text hover:bg-surface-soft transition-all"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zen-border bg-page/98 px-4 pt-3 pb-6 shadow-soft backdrop-blur-xl animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  pathname === link.href
                    ? "bg-primary text-white"
                    : "text-zen-muted hover:text-ink hover:bg-surface-soft"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-3 border-t border-zen-border pt-3 flex flex-col gap-2">
              {status === "authenticated" ? (
                <Link
                  href={dashboardUrl}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Go to Workspace</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center rounded-xl border border-zen-border bg-white py-2.5 text-sm font-semibold text-ink"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white"
                  >
                    <span>Get started free</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
