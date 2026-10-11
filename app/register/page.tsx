"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, AlertTriangle, Building2, Store, HeartHandshake, Loader2, ArrowRight } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/lib/validators";
import { Logo } from "@/components/Logo";
import { FadeContent } from "@/components/reactbits";

const inputClass =
  "block w-full rounded-lg border-0 bg-white px-3.5 py-2.5 text-sm text-ink ring-1 ring-inset ring-zen-border placeholder:text-zen-faint focus:ring-2 focus:ring-inset focus:ring-primary";

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = session.user.role;
      let target = "/recipient/dashboard";
      if (role === "PROVIDER") target = "/provider/dashboard";
      else if (role === "ADMIN") target = "/admin";
      router.replace(target);
    }
  }, [status, session, router]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      organisationName: "",
      password: "",
      role: "PROVIDER",
    },
  });

  const role = watch("role");

  async function onSubmit(data: RegisterInput) {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, latitude: null, longitude: null }),
      });
      const json = await res.json();
      if (!json.success) {
        setServerError(json.message ?? "Registration failed.");
        return;
      }
      if (data.role === "RECIPIENT") {
        setPendingVerification(true);
      } else {
        router.push("/login");
      }
    } catch {
      setServerError("Network error — please try again.");
    }
  }

  if (pendingVerification) {
    return (
      <div className="relative flex min-h-dvh items-center justify-center bg-page px-4 font-sans antialiased text-zen-text selection:bg-primary-faint selection:text-ink">
        <FadeContent>
          <div className="relative w-full max-w-md rounded-2xl border border-zen-border bg-white p-8 text-center shadow-subtle">
            <span className="inline-flex rounded-2xl bg-amber-50 p-3 text-amber-700 ring-1 ring-amber-300" aria-hidden>
              <HeartHandshake className="h-7 w-7" />
            </span>
            <h1 className="mt-4 text-2xl font-serif font-bold text-ink">Almost there!</h1>
            <p className="mt-2 text-sm leading-relaxed text-zen-muted">
              Your recipient account was created. An administrator must verify
              your organisation before you can claim food. Sign in to check your
              verification status.
            </p>
            <div className="mt-6">
              <Link
                href="/login"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover shadow-subtle"
              >
                <span>Go to sign in</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </FadeContent>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-page px-4 py-10 font-sans antialiased text-zen-text selection:bg-primary-faint selection:text-ink">
      <div className="relative w-full max-w-md">
        <FadeContent>
          <div className="mb-6 flex flex-col items-center text-center">
            <Link href="/" aria-label="Get Fed home" className="transition-transform duration-200 hover:scale-[1.02]">
              <Logo size={52} />
            </Link>
            <div className="mt-4 text-xs font-semibold uppercase tracking-widest text-primary">
              Create an Account
            </div>
            <h1 className="mt-1 text-2xl font-serif font-bold text-ink sm:text-3xl">
              Join <span className="text-primary italic font-serif">Get Fed</span>
            </h1>
            <p className="mt-1.5 text-sm text-zen-muted">
              Coordinate surplus food before the pickup window closes.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 rounded-2xl border border-zen-border bg-white p-6 sm:p-8 shadow-subtle"
            noValidate
          >
            {serverError && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden />
                <span>{serverError}</span>
              </p>
            )}

            {/* Role picker */}
            <fieldset>
              <legend className="mb-1.5 block text-sm font-medium text-zen-text">
                I am joining as
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border p-3 text-sm font-medium transition-all ${
                    role === "PROVIDER"
                      ? "border-primary bg-primary-faint text-primary-hover font-semibold ring-1 ring-primary-soft"
                      : "border-zen-border bg-white text-zen-muted hover:border-zen-border-strong hover:bg-surface-soft"
                  }`}
                >
                  <input type="radio" value="PROVIDER" className="sr-only" {...register("role")} />
                  <Store className="h-5 w-5" aria-hidden />
                  Provider
                  <span className="text-[11px] font-normal text-zen-muted">I have surplus food</span>
                </label>
                <label
                  className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border p-3 text-sm font-medium transition-all ${
                    role === "RECIPIENT"
                      ? "border-primary bg-primary-faint text-primary-hover font-semibold ring-1 ring-primary-soft"
                      : "border-zen-border bg-white text-zen-muted hover:border-zen-border-strong hover:bg-surface-soft"
                  }`}
                >
                  <input type="radio" value="RECIPIENT" className="sr-only" {...register("role")} />
                  <HeartHandshake className="h-5 w-5" aria-hidden />
                  Recipient
                  <span className="text-[11px] font-normal text-zen-muted">I collect surplus food</span>
                </label>
              </div>
              {role === "RECIPIENT" && (
                <p className="mt-2 text-xs text-amber-700">
                  Recipient organisations require admin verification before claiming.
                </p>
              )}
            </fieldset>

            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-zen-text">
                Your name
              </label>
              <input id="name" className={inputClass} placeholder="Priya Sharma" autoComplete="name" {...register("name")} />
              {errors.name && <p className="mt-1 text-xs text-rose-600" role="alert">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="organisationName" className="mb-1.5 block text-sm font-medium text-zen-text">
                <Building2 className="mr-1 inline h-4 w-4" aria-hidden />
                Organisation
              </label>
              <input
                id="organisationName"
                className={inputClass}
                placeholder={role === "PROVIDER" ? "Central Canteen" : "Sunshine NGO"}
                autoComplete="organization"
                {...register("organisationName")}
              />
              {errors.organisationName && (
                <p className="mt-1 text-xs text-rose-600" role="alert">{errors.organisationName.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zen-text">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className={inputClass}
                  placeholder="you@organisation.org"
                  autoComplete="email"
                  {...register("email")}
                />
                {errors.email && <p className="mt-1 text-xs text-rose-600" role="alert">{errors.email.message}</p>}
              </div>
              <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-zen-text">
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  className={inputClass}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                  {...register("phone")}
                />
                {errors.phone && <p className="mt-1 text-xs text-rose-600" role="alert">{errors.phone.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-zen-text">
                Password
              </label>
              <input
                id="password"
                type="password"
                className={inputClass}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-rose-600" role="alert">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 shadow-subtle active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  <span>Creating account…</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" aria-hidden />
                  <span>Create account</span>
                </>
              )}
            </button>

            <p className="text-center text-sm text-zen-muted">
              Already registered?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary hover:text-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                Sign in
              </Link>
            </p>
          </form>
        </FadeContent>
      </div>
    </div>
  );
}
