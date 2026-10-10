"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
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
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { Logo } from "@/components/Logo";

// ---------------------------------------------------------------------------
// Role-aware app shell: navbar + mobile nav (mobile-first, PRD §44/§50).
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const role = session?.user?.role as string | undefined;
  const items = (role && NAV[role]) || [];
  const homeByRole: Record<string, string> = {
    PROVIDER: "/provider/dashboard",
    RECIPIENT: "/recipient/dashboard",
    ADMIN: "/admin",
  };

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-white/75 shadow-sm shadow-stone-200/40 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-6">
            <Link
              href={role ? homeByRole[role] : "/"}
              aria-label="Food Worth Saving home"
              className="transition-transform duration-200 hover:scale-[1.03]"
            >
              <Logo size={34} withWordmark />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
              {items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== homeByRole[role ?? ""] && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-green-50 text-green-800"
                        : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-1.5">
            {role === "RECIPIENT" && session?.user?.verificationStatus !== "VERIFIED" && (
              <span className="badge badge-pending hidden sm:inline-flex">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                Pending verification
              </span>
            )}
            <NotificationBell />
            <button
              onClick={handleSignOut}
              className="hidden rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-500 sm:block"
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" aria-hidden />
            </button>
            <button
              className="rounded-lg p-2 text-stone-600 hover:bg-stone-100 md:hidden"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-label="Toggle navigation menu"
            >
              {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <nav
            className="border-t border-stone-100 bg-white px-4 pb-4 pt-2 md:hidden"
            aria-label="Mobile"
          >
            <ul className="grid gap-1" role="list">
              {items.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                        active
                          ? "bg-green-50 text-green-800"
                          : "text-stone-600 hover:bg-stone-100"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              <li>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  Sign out
                </button>
              </li>
            </ul>
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 md:pb-10">
        {children}
      </main>

      <footer className="border-t border-stone-200 bg-white py-4 text-center text-xs text-stone-400">
        Food Worth Saving — real-time surplus food coordination. Every meal counts.
      </footer>
    </div>
  );
}
