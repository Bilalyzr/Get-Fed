"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, AlertTriangle, Loader2 } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validators";
import { Logo } from "@/components/Logo";

function LoginForm() {
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const callbackUrl = searchParams.get("callbackUrl") ?? "/login/redirect";

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
      const role = session?.user?.role;

      let destination = callbackUrl;
      if (!destination || destination === "/login/redirect") {
        if (role === "PROVIDER") destination = "/provider/dashboard";
        else if (role === "ADMIN") destination = "/admin";
        else destination = "/recipient/dashboard";
      }

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
          className="flex items-start gap-2 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300 ring-1 ring-rose-500/30"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{authError}</span>
        </p>
      )}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-stone-300">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="block w-full rounded-lg border-0 bg-stone-900/90 px-3.5 py-2.5 text-sm text-white ring-1 ring-inset ring-white/15 placeholder:text-stone-500 focus:bg-stone-900 focus:ring-2 focus:ring-inset focus:ring-emerald-400"
          placeholder="you@organisation.org"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-xs text-rose-400" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-stone-300">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="block w-full rounded-lg border-0 bg-stone-900/90 px-3.5 py-2.5 text-sm text-white ring-1 ring-inset ring-white/15 placeholder:text-stone-500 focus:bg-stone-900 focus:ring-2 focus:ring-inset focus:ring-emerald-400"
          placeholder="••••••••"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
        {errors.password && (
          <p id="password-error" className="mt-1 text-xs text-rose-400" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-stone-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
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

      <p className="text-center text-sm text-stone-400">
        New here?{" "}
        <Link
          href="/register"
          className="font-semibold text-emerald-400 hover:text-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-stone-950 px-4 py-10">
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" aria-label="Get Fed home">
            <Logo size={56} />
          </Link>
          <h1 className="mt-5 text-2xl font-extrabold text-white">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-stone-400">
            Sign in to coordinate surplus food in real time.
          </p>
        </div>

        <div className="rounded-2xl border border-stone-800 bg-stone-900/70 p-6 shadow-xl sm:p-7">
          <Suspense fallback={<div className="skeleton h-80 !bg-stone-800" aria-label="Loading sign in form" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
