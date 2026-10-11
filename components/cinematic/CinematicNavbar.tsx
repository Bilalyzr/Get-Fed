"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard, ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";

// ---------------------------------------------------------------------------
// CinematicNavbar — floating glass navbar for the public pages.
// Finetuned behaviours:
// - Compacts on scroll; hides scrolling down, returns scrolling up
//   (skipped under prefers-reduced-motion)
// - Session-aware CTAs without loading flash (no layout shift)
// - Accessible mobile menu: aria-expanded/controls, Escape closes,
//   closes on route change, real CSS drop animation
// - Visible focus rings on every control
// ---------------------------------------------------------------------------

export function CinematicNavbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const lastY = useRef(0);

  const role = session?.user?.role;
  const dashboardUrl =
    role === "PROVIDER"
      ? "/provider/dashboard"
      : role === "ADMIN"
      ? "/admin"
      : "/recipient/dashboard";

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    lastY.current = window.scrollY;

    const handleScroll = () => {
      const y = window.scrollY;
      setIsScrolled(y > 20);
      // Hide only after leaving the hero area, never while the menu is open.
      if (!reduced && !mobileMenuOpen) {
        const delta = y - lastY.current;
        if (delta > 6 && y > 160) setHidden(true);
        else if (delta < -6 || y <= 160) setHidden(false);
      }
      lastY.current = y;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileMenuOpen]);

  // Close the mobile menu on route change and on Escape.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/how-it-works", label: "How It Works" },
  ];

  const linkBase =
    "relative rounded-full px-4 py-1.5 text-xs font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "border-b border-zen-border-strong/80 bg-page/90 shadow-subtle backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      } ${hidden ? "-translate-y-full" : "translate-y-0"}`}
    >
      <div
        className={`mx-auto flex w-full max-w-7xl items-center justify-between px-4 transition-all duration-300 sm:px-6 lg:px-8 ${
          isScrolled ? "py-2.5" : "py-4"
        }`}
      >
        {/* Brand logo — breathes slightly smaller when scrolled */}
        <div className="flex items-center">
          <Link
            href="/"
            aria-label="Get Fed home"
            className={`group flex origin-left items-center gap-3 transition-transform duration-300 hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ${
              isScrolled ? "scale-90" : "scale-100"
            }`}
          >
            <Logo size={36} withWordmark />
          </Link>
        </div>

        {/* Center desktop navigation */}
        <nav
          className="hidden items-center gap-1 rounded-full border border-zen-border bg-white/70 p-1.5 shadow-subtle backdrop-blur-md md:flex"
          aria-label="Main"
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`${linkBase} ${
                  isActive
                    ? "bg-primary text-white shadow-subtle"
                    : "text-zen-muted hover:bg-surface-soft/80 hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side CTA & session — stable height avoids layout shift while
            the session resolves; CTAs render only once status is known. */}
        <div className="hidden h-9 items-center gap-3 md:flex">
          {status === "loading" ? (
            <span className="block h-8 w-40 animate-pulse rounded-xl bg-surface-soft/70" aria-hidden />
          ) : status === "authenticated" ? (
            <Link
              href={dashboardUrl}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-subtle transition-all hover:bg-primary-hover active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
              <span>Workspace</span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl border border-zen-border bg-white/80 px-4 py-2 text-xs font-semibold text-ink shadow-subtle transition-all hover:bg-surface-soft active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="group inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-subtle transition-all hover:bg-primary-hover active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span>Get started</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            className="rounded-xl border border-zen-border bg-white/80 p-2 text-zen-text transition-all hover:bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          className="animate-navbar-drop border-b border-zen-border bg-page/95 px-4 pb-6 pt-3 shadow-soft backdrop-blur-xl md:hidden"
        >
          <nav className="flex flex-col gap-2" aria-label="Mobile">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  pathname === link.href
                    ? "bg-primary text-white"
                    : "text-zen-muted hover:bg-surface-soft hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-3 flex flex-col gap-2 border-t border-zen-border pt-3">
              {status === "authenticated" ? (
                <Link
                  href={dashboardUrl}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <LayoutDashboard className="h-4 w-4" aria-hidden />
                  <span>Go to Workspace</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center rounded-xl border border-zen-border bg-white py-2.5 text-sm font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <span>Get started free</span>
                    <ArrowRight className="h-4 w-4" aria-hidden />
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
