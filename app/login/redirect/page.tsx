"use client";

import { useEffect } from "react";
import { useSession, getSession } from "next-auth/react";

// Role-aware post-login redirect (PRD §7 role routing).
export default function LoginRedirectPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    let active = true;

    async function routeUser() {
      if (status === "loading") return;

      let currentSession = session;
      if (!currentSession?.user) {
        currentSession = await getSession();
      }

      if (!active) return;

      if (!currentSession?.user) {
        window.location.href = "/login";
        return;
      }

      const role = currentSession.user.role;
      let target = "/recipient/dashboard";
      if (role === "PROVIDER") target = "/provider/dashboard";
      else if (role === "ADMIN") target = "/admin";

      window.location.href = target;
    }

    routeUser();

    return () => {
      active = false;
    };
  }, [session, status]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-stone-950 text-stone-200">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <p className="text-sm font-medium text-stone-400">Directing to your dashboard…</p>
      </div>
    </div>
  );
}
