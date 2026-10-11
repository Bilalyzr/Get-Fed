"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn, getSession, useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, AlertTriangle, Loader2 } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validators";
import { Logo } from "@/components/Logo";
import { BackButton } from "@/components/BackButton";
import { FadeContent } from "@/components/reactbits";
import { sanitizeCallbackUrl } from "@/lib/routing";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [authError, setAuthError] = useState<string | null>(null);

  const rawCallbackUrl = searchParams.get("callbackUrl");

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Never trust a stale callbackUrl across roles (e.g. admin landing in
      // the provider portal) and never honor absolute/external URLs.
      router.replace(sanitizeCallbackUrl(session.user.role, rawCallbackUrl));
    }
  }, [status, session, router, rawCallbackUrl]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  if (status === "authenticated") {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm font-medium text-zen-muted">Already signed in. Taking you to your dashboard…</p>
      </div>
    );
  }

  async function onSubmit(data: LoginInput) {
    setAuthError(null);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (!res) {
        setAuthError("Failed to reach authentication service. Please try again.");
        return;
      }

      if (res.error) {
        if (res.error === "CredentialsSignin") {
          setAuthError(
            "Invalid email or password. Please check your credentials and try again."
          );
        } else {
          setAuthError(res.error);
        }
        return;
      }

      // Check current session for role-based redirect
      const session = await getSession();
      const destination = sanitizeCallbackUrl(session?.user?.role, rawCallbackUrl);

      window.location.href = destination;
    } catch {
      setAuthError("An unexpected error occurred during sign in. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {authError && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden />
          <span>{authError}</span>
        </p>
      )}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zen-text">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="block w-full rounded-lg border-0 bg-page/70 px-3.5 py-2.5 text-sm text-ink ring-1 ring-inset ring-zen-border placeholder:text-zen-faint focus:ring-2 focus:ring-inset focus:ring-primary"
          placeholder="you@organisation.org"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-xs text-rose-600" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-zen-text">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="block w-full rounded-lg border-0 bg-page/70 px-3.5 py-2.5 text-sm text-ink ring-1 ring-inset ring-zen-border placeholder:text-zen-faint focus:ring-2 focus:ring-inset focus:ring-primary"
          placeholder="••••••••"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
        {errors.password && (
          <p id="password-error" className="mt-1 text-xs text-rose-600" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-page transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 shadow-subtle active:scale-[0.98]"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            <span>Signing in…</span>
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" aria-hidden />
            <span>Sign in</span>
          </>
        )}
      </button>

      <p className="text-center text-sm text-zen-muted">
        New here?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary hover:text-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-page px-4 py-10 font-sans antialiased text-zen-text selection:bg-primary-faint selection:text-ink">
      {/* Ambient palette glow (matches landing hero) */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
        <div className="h-[420px] w-[620px] rounded-full bg-primary-faint/40 blur-[120px]" />
        <div className="absolute -top-10 right-10 h-64 w-64 rounded-full bg-warm/60 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex justify-start">
          <BackButton fallbackHref="/" label="Back to home" />
        </div>
        <FadeContent>
          <div className="mb-8 flex flex-col items-center text-center">
            <Link href="/" aria-label="Get Fed home" className="transition-transform duration-200 hover:scale-[1.02]">
              <Logo size={52} />
            </Link>
            <div className="mt-4 inline-flex items-center rounded-full border border-primary/25 bg-page/80 px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-primary">
              Sign In
            </div>
            <h1 className="mt-2 text-2xl font-serif font-bold text-ink sm:text-3xl">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-zen-muted">
              Coordinate surplus food in real time with verified integrity.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-zen-border bg-white p-6 shadow-soft sm:p-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-hover via-primary to-primary-soft" aria-hidden />
            <Suspense fallback={<div className="skeleton h-80" aria-label="Loading sign in form" />}>
              <LoginForm />
            </Suspense>
          </div>
        </FadeContent>
      </div>
    </div>
  );
}
