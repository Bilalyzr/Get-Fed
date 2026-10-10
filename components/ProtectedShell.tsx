"use client";

import { useEffect, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Client-side session gate: renders AppShell only for the expected role.
// Middleware enforces this server-side too (defence in depth, PRD §47).
// ---------------------------------------------------------------------------

export function ProtectedShell({
  role,
  children,
}: {
  role: "PROVIDER" | "RECIPIENT" | "ADMIN";
  children: ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    const userRole = session.user.role;
    if (userRole !== role && userRole !== "ADMIN") {
      const home =
        userRole === "PROVIDER"
          ? "/provider/dashboard"
          : userRole === "RECIPIENT"
          ? "/recipient/dashboard"
          : "/admin";
      router.replace(home);
    }
  }, [session, status, role, router, pathname]);

  if (status === "loading" || !session?.user) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-stone-400">
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
          <p className="text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (session.user.role !== role && session.user.role !== "ADMIN") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-stone-400">
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
          <p className="text-sm">Redirecting…</p>
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
