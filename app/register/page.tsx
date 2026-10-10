"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, AlertTriangle, Building2, Store, HeartHandshake } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/lib/validators";
import { Logo } from "@/components/Logo";
import { Aurora, Particles, GradientText, ShinyText, StarBorder, FadeContent, ClickSpark } from "@/components/reactbits";

const inputClass =
  "block w-full rounded-lg border-0 bg-white/5 px-3.5 py-2.5 text-sm text-white ring-1 ring-inset ring-white/15 placeholder:text-stone-500 focus:bg-white/10 focus:ring-2 focus:ring-inset focus:ring-lime-400";

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);

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
      <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-stone-950 px-4">
        <Aurora />
        <Particles color="#86efac" density={0.00005} />
        <FadeContent>
          <div className="glass-dark relative w-full max-w-md rounded-2xl border border-white/10 p-8 text-center">
            <span className="inline-flex rounded-2xl bg-amber-400/15 p-3 text-amber-300 ring-1 ring-amber-400/30" aria-hidden>
              <HeartHandshake className="h-7 w-7" />
            </span>
            <h1 className="mt-4 text-xl font-extrabold text-white">Almost there!</h1>
            <p className="mt-2 text-sm leading-relaxed text-stone-300">
              Your recipient account was created. An administrator must verify
              your organisation before you can claim food. Sign in to check your
              verification status.
            </p>
            <ClickSpark sparkColor="#a3e635">
              <StarBorder color="#4ade80" speed="5s" className="mt-6 w-full">
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center px-4 py-3 text-sm font-bold text-lime-50"
                >
                  <ShinyText speed={3.2}>Go to sign in</ShinyText>
                </Link>
              </StarBorder>
            </ClickSpark>
          </div>
        </FadeContent>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-stone-950 px-4 py-10">
      <Aurora />
      <Particles color="#86efac" density={0.00004} />

      <div className="relative w-full max-w-md">
        <FadeContent>
          <div className="mb-6 flex flex-col items-center text-center">
            <Link href="/" aria-label="Get Fed home">
              <Logo size={52} />
            </Link>
            <h1 className="mt-5 text-2xl font-extrabold text-white">
              Join{" "}
              <GradientText colors={["#a3e635", "#4ade80", "#a3e635"]}>
                Get Fed
              </GradientText>
            </h1>
            <p className="mt-1 text-sm text-stone-400">
              Coordinate surplus food before the pickup window closes.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="glass-dark space-y-4 rounded-2xl border border-white/10 p-6 shadow-2xl shadow-emerald-950/50 sm:p-7"
            noValidate
          >
            {serverError && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300 ring-1 ring-rose-500/30"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {serverError}
              </p>
            )}

            {/* Role picker */}
            <fieldset>
              <legend className="mb-1.5 block text-sm font-medium text-stone-300">
                I am joining as
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-sm font-medium transition-colors ${
                    role === "PROVIDER"
                      ? "border-lime-400 bg-lime-400/10 text-lime-200"
                      : "border-white/10 bg-white/[0.03] text-stone-400 hover:border-white/20"
                  }`}
                >
                  <input type="radio" value="PROVIDER" className="sr-only" {...register("role")} />
                  <Store className="h-5 w-5" aria-hidden />
                  Provider
                  <span className="text-[11px] font-normal text-stone-500">I have surplus food</span>
                </label>
                <label
                  className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-sm font-medium transition-colors ${
                    role === "RECIPIENT"
                      ? "border-lime-400 bg-lime-400/10 text-lime-200"
                      : "border-white/10 bg-white/[0.03] text-stone-400 hover:border-white/20"
                  }`}
                >
                  <input type="radio" value="RECIPIENT" className="sr-only" {...register("role")} />
                  <HeartHandshake className="h-5 w-5" aria-hidden />
                  Recipient
                  <span className="text-[11px] font-normal text-stone-500">I collect surplus food</span>
                </label>
              </div>
              {role === "RECIPIENT" && (
                <p className="mt-2 text-xs text-amber-300/90">
                  Recipient organisations require admin verification before claiming.
                </p>
              )}
            </fieldset>

            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-stone-300">
                Your name
              </label>
              <input id="name" className={inputClass} placeholder="Priya Sharma" autoComplete="name" {...register("name")} />
              {errors.name && <p className="mt-1 text-xs text-rose-400" role="alert">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="organisationName" className="mb-1.5 block text-sm font-medium text-stone-300">
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
                <p className="mt-1 text-xs text-rose-400" role="alert">{errors.organisationName.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-stone-300">
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
                {errors.email && <p className="mt-1 text-xs text-rose-400" role="alert">{errors.email.message}</p>}
              </div>
              <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-stone-300">
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
                {errors.phone && <p className="mt-1 text-xs text-rose-400" role="alert">{errors.phone.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-stone-300">
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
                <p className="mt-1 text-xs text-rose-400" role="alert">{errors.password.message}</p>
              )}
            </div>

            <ClickSpark sparkColor="#a3e635">
              <StarBorder color="#4ade80" speed="5s" className="w-full">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-lime-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UserPlus className="h-4 w-4" aria-hidden />
                  {isSubmitting ? "Creating account…" : <ShinyText speed={3.2}>Create account</ShinyText>}
                </button>
              </StarBorder>
            </ClickSpark>

            <p className="text-center text-sm text-stone-400">
              Already registered?{" "}
              <Link
                href="/login"
                className="font-semibold text-lime-400 hover:text-lime-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-400"
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
