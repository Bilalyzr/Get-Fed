"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, AlertTriangle } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validators";
import { Logo } from "@/components/Logo";
import { Aurora, Particles, GradientText, ShinyText, StarBorder, FadeContent, ClickSpark } from "@/components/reactbits";

function LoginForm() {
  const router = useRouter();
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
    const res = await signIn("credentials", {
      redirect: false,
      email: data.email,
      password: data.password,
    });
    if (res?.error) {
      setAuthError(
        "Sign in failed — check your email and password. Suspended accounts are blocked."
      );
      return;
    }
    router.push(callbackUrl || "/login/redirect");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {authError && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300 ring-1 ring-rose-500/30"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {authError}
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
          className="block w-full rounded-lg border-0 bg-white/5 px-3.5 py-2.5 text-sm text-white ring-1 ring-inset ring-white/15 placeholder:text-stone-500 focus:bg-white/10 focus:ring-2 focus:ring-inset focus:ring-lime-400"
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
          className="block w-full rounded-lg border-0 bg-white/5 px-3.5 py-2.5 text-sm text-white ring-1 ring-inset ring-white/15 placeholder:text-stone-500 focus:bg-white/10 focus:ring-2 focus:ring-inset focus:ring-lime-400"
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

      <ClickSpark sparkColor="#a3e635">
        <StarBorder color="#4ade80" speed="5s" className="w-full">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-lime-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" aria-hidden />
            {isSubmitting ? "Signing in…" : <ShinyText speed={3.2}>Sign in</ShinyText>}
          </button>
        </StarBorder>
      </ClickSpark>

      <p className="text-center text-sm text-stone-400">
        New here?{" "}
        <Link
          href="/register"
          className="font-semibold text-lime-400 hover:text-lime-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-400"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-stone-950 px-4 py-10">
      <Aurora />
      <Particles color="#86efac" density={0.00005} />

      <div className="relative w-full max-w-md">
        <FadeContent>
          <div className="mb-8 flex flex-col items-center text-center">
            <Link href="/" aria-label="Get Fed home">
              <Logo size={56} />
            </Link>
            <h1 className="mt-5 text-2xl font-extrabold text-white">
              <GradientText colors={["#a3e635", "#4ade80", "#a3e635"]}>
                Welcome back
              </GradientText>
            </h1>
            <p className="mt-1.5 text-sm text-stone-400">
              Sign in to coordinate surplus food in real time.
            </p>
          </div>

          <div className="glass-dark rounded-2xl border border-white/10 p-6 shadow-2xl shadow-emerald-950/50 sm:p-7">
            <Suspense fallback={<div className="skeleton h-80 !bg-white/5" aria-label="Loading sign in form" />}>
              <LoginForm />
            </Suspense>
          </div>
        </FadeContent>
      </div>
    </div>
  );
}
