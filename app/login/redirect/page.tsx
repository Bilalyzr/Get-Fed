"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// Role-aware post-login redirect (PRD §7 role routing).
export default function LoginRedirectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.replace("/login");
      return;
    }
    const role = session.user.role;
    if (role === "PROVIDER") router.replace("/provider/dashboard");
    else if (role === "ADMIN") router.replace("/admin");
    else router.replace("/recipient/dashboard");
  }, [session, status, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="skeleton h-8 w-48" aria-label="Redirecting" />
    </div>
  );
}
