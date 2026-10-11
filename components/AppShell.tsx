"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  PlusCircle,
  ListOrdered,
  ScanLine,
  BarChart3,
  ShoppingBasket,
  QrCode,
  UserCircle,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  ClipboardList,
  Users,
  FileBarChart,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { Logo } from "@/components/Logo";

// ---------------------------------------------------------------------------
// Role-aware app shell: collapsible deep-green sidebar + responsive mobile
// drawer, styled in the Color Hunt palette (forest #0D530E / green #306D29 /
// khaki #E7E1B1 / cream #FBF5DD).
// ---------------------------------------------------------------------------

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

const NAV: Record<string, NavItem[]> = {
  PROVIDER: [
    { href: "/provider/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/provider/listings", label: "Listings", icon: ListOrdered },
    { href: "/provider/listings/new", label: "New Listing", icon: PlusCircle },
    { href: "/provider/claims", label: "Claims", icon: ClipboardList },
    { href: "/provider/scanner", label: "Scanner", icon: ScanLine },
    { href: "/provider/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/profile", label: "My Account", icon: UserCircle },
  ],
  RECIPIENT: [
    { href: "/recipient/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/recipient/food", label: "Discover Food", icon: ShoppingBasket },
    { href: "/recipient/claims", label: "My Claims", icon: ClipboardList },
    { href: "/recipient/qr", label: "My QR", icon: QrCode },
    { href: "/recipient/profile", label: "Profile", icon: UserCircle },
  ],
  ADMIN: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/listings", label: "Listings", icon: ListOrdered },
    { href: "/admin/claims", label: "Claims", icon: ClipboardList },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/reports", label: "Reports", icon: FileBarChart },
    { href: "/profile", label: "My Account", icon: UserCircle },
  ],
};

const COLLAPSE_KEY = "fws-sidebar-collapsed"; // non-critical UI preference (PRD §66)

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Restore persisted collapse preference after mount (hydration-safe).
  useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      window.localStorage.setItem(COLLAPSE_KEY, prev ? "0" : "1");
      return !prev;
    });
  }

  const role = session?.user?.role as string | undefined;
  const items = (role && NAV[role]) || [];
  const homeByRole: Record<string, string> = {
    PROVIDER: "/provider/dashboard",
    RECIPIENT: "/recipient/dashboard",
    ADMIN: "/admin",
  };

  const portalTitle: Record<string, string> = {
    PROVIDER: "Provider Portal",
    RECIPIENT: "Recipient Portal",
    ADMIN: "Admin Workspace",
  };

  async function handleSignOut() {
    await signOut({ callbackUrl: "/login" });
  }

  // ---------------------------------------------------------------------
  // Sidebar content — `collapsed` only applies to the desktop rail; the
  // mobile drawer always renders the expanded layout.
  // ---------------------------------------------------------------------
  function renderNav(collapsedMode: boolean) {
    return (
      <div className="flex h-full flex-col">
        {/* Brand & Portal Header */}
        <div
          className={`border-b border-white/10 px-4 py-4 ${
            collapsedMode ? "flex flex-col items-center gap-3" : ""
          }`}
        >
            <Link
              href={role ? homeByRole[role] : "/"}
              aria-label="Get Fed home"
              className="inline-block transition-transform duration-200 hover:scale-[1.02]"
              onClick={() => setMenuOpen(false)}
            >
              {collapsedMode ? (
                <Logo size={36} />
              ) : (
                <Logo
                  size={36}
                  withWordmark
                  wordmarkClassName="text-sm font-extrabold tracking-tight text-page font-sans"
                />
              )}
            </Link>
            {!collapsedMode && role && (
              <div className="mt-3 flex items-center justify-between">
                <span className="inline-flex items-center rounded-md border border-page/25 bg-white/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-page/90">
                  {portalTitle[role] ?? role}
                </span>
                {role === "RECIPIENT" && session?.user?.verificationStatus === "VERIFIED" && (
                  <span className="inline-flex items-center rounded-md bg-page px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-hover">
                    Verified
                  </span>
                )}
              </div>
            )}
          </div>

        {/* Nav List */}
        <nav
          className={`flex-1 space-y-1 overflow-y-auto px-3 py-4 ${collapsedMode ? "px-2" : ""}`}
          aria-label="Sidebar Primary"
        >
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== homeByRole[role ?? ""] && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                title={collapsedMode ? item.label : undefined}
                aria-label={collapsedMode ? item.label : undefined}
                className={`flex items-center rounded-xl text-sm font-medium transition-all ${
                  collapsedMode
                    ? "justify-center px-0 py-2.5"
                    : "gap-3 px-3.5 py-2.5"
                } ${
                  active
                    ? "bg-page text-primary-hover font-semibold shadow-subtle"
                    : "text-page/75 hover:bg-white/10 hover:text-page"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={`h-4.5 w-4.5 shrink-0 ${active ? "text-primary" : "text-page/70"}`}
                  aria-hidden
                />
                {!collapsedMode && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User / Sign Out Footer */}
        <div
          className={`mt-auto border-t border-white/10 bg-black/20 ${
            collapsedMode ? "flex flex-col items-center gap-3 p-3" : "p-4"
          }`}
        >
          <div
            className={`flex items-center gap-3 ${collapsedMode ? "flex-col gap-0" : ""}`}
            title={collapsedMode ? session?.user?.name ?? undefined : undefined}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-page/25 bg-white/10 text-sm font-bold text-page">
              {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
            </div>
            {!collapsedMode && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-page">
                  {session?.user?.name ?? "Account"}
                </p>
                <p className="truncate text-[11px] text-page/60">
                  {session?.user?.email ?? ""}
                </p>
              </div>
            )}
          </div>

          <button
            id="sidebar-signout-btn"
            onClick={handleSignOut}
            title={collapsedMode ? "Sign out" : undefined}
            aria-label={collapsedMode ? "Sign out" : undefined}
            className={`mt-3 flex items-center rounded-lg border border-page/25 bg-white/5 px-3 py-2 text-xs font-semibold text-page/85 transition-colors hover:bg-page hover:text-primary-hover ${
              collapsedMode ? "w-full justify-center" : "w-full justify-center gap-2"
            }`}
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden />
            {!collapsedMode && <span>Sign out</span>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-page font-sans antialiased text-zen-text selection:bg-primary-faint selection:text-ink">
      {/* ------------------------------------------------------------------ */}
      {/* Desktop Sidebar — deep forest green, collapsible to icon rail      */}
      {/* ------------------------------------------------------------------ */}
      <aside
        className={`hidden md:flex md:flex-col md:shrink-0 md:sticky md:top-0 md:h-screen md:border-r md:border-primary-hover/40 md:bg-gradient-to-b md:from-ink md:via-[#12460f] md:to-primary md:shadow-elevated md:transition-[width] md:duration-300 md:ease-in-out ${
          collapsed ? "md:w-[76px]" : "md:w-64"
        }`}
        aria-label="Application sidebar"
      >
        {/* Collapse toggle — floats on the sidebar edge */}
        <button
          onClick={toggleCollapsed}
          className="absolute -right-3 top-5 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-primary-hover/40 bg-page text-primary-hover shadow-subtle transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <PanelLeftClose className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>

        {renderNav(collapsed)}
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile Top Bar + Slide-over Drawer                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zen-border bg-white/90 px-4 shadow-subtle backdrop-blur-md md:hidden">
          <button
            onClick={() => setMenuOpen(true)}
            className="rounded-lg p-2 text-zen-text transition-colors hover:bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            aria-label="Open sidebar navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href={role ? homeByRole[role] : "/"} aria-label="Get Fed home">
            <Logo size={32} withWordmark />
          </Link>

          <div className="flex items-center gap-1.5">
            <NotificationBell />
          </div>
        </header>

        {/* Mobile Drawer Overlay */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition-opacity"
              onClick={() => setMenuOpen(false)}
              aria-hidden
            />
            {/* Drawer — same deep-green treatment as the desktop sidebar */}
            <div className="relative flex w-4/5 max-w-xs flex-1 flex-col bg-gradient-to-b from-ink via-[#12460f] to-primary shadow-elevated">
              <button
                onClick={() => setMenuOpen(false)}
                className="absolute right-3.5 top-4 rounded-lg p-1.5 text-page/80 transition-colors hover:bg-white/10 hover:text-page focus-visible:outline focus-visible:outline-2 focus-visible:outline-page z-10"
                aria-label="Close sidebar navigation"
              >
                <X className="h-5 w-5" />
              </button>
              {renderNav(false)}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Desktop Top Utility Header (notifications, status)               */}
        {/* ---------------------------------------------------------------- */}
        <div className="hidden h-14 items-center justify-between border-b border-zen-border bg-white/70 px-8 backdrop-blur-md md:flex">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zen-muted">
              {role ? (portalTitle[role] ?? role) : "Get Fed"}
            </span>
            <span className="text-zen-border font-light">/</span>
            <span className="text-xs font-serif font-bold text-ink">
              {items.find((i) => pathname === i.href || (i.href !== homeByRole[role ?? ""] && pathname.startsWith(i.href)))?.label ?? "Terminal"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-zen-border bg-page/70 px-3 py-1 text-[11px] font-mono text-ink">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>Campus Grid · Active</span>
            </div>

            {role === "RECIPIENT" && session?.user?.verificationStatus !== "VERIFIED" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-0.5 text-[11px] font-semibold text-amber-800 shadow-subtle">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-600" aria-hidden />
                Pending Verification
              </span>
            )}

            <div className="flex items-center gap-2 pl-2 border-l border-zen-border">
              <NotificationBell />
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Main Content Area                                                */}
        {/* ---------------------------------------------------------------- */}
        <main className="flex-1 px-4 py-6 sm:px-8 md:py-8 max-w-7xl w-full mx-auto">
          {role === "RECIPIENT" && session?.user?.verificationStatus !== "VERIFIED" && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-900 shadow-subtle">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
              <div>
                <strong className="font-serif font-bold">Organisation Pending Verification</strong>
                <p className="mt-0.5 text-xs text-amber-800">
                  Your recipient profile is currently under review by campus administration. You can inspect surplus items in real time, and claim actions will unlock immediately upon verification.
                </p>
              </div>
            </div>
          )}
          {children}
        </main>

        <footer className="border-t border-zen-border bg-page/80 py-6 text-center text-xs font-mono text-zen-muted">
          Get Fed Platform · Deterministic Zero-Waste Campus Logistics · Every portion recovered.
        </footer>
      </div>
    </div>
  );
}
