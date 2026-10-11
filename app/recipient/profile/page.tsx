"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Crosshair, SlidersHorizontal, Loader2, Building2, MapPin, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";
import { recipientPreferenceSchema } from "@/lib/validators";

type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  organisationName: string;
  verificationStatus: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
};

export default function RecipientProfilePage() {
  const { update: updateSession } = useSession();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const [prefs, setPrefs] = useState({
    maxDistanceKm: 10,
    minimumQuantity: 1,
    maximumQuantity: 100,
    availableFrom: "",
    availableUntil: "",
  });

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/recipient/profile");
      const json = await res.json();
      if (json.success) {
        setProfile(json.data.profile);
        if (json.data.profile?.latitude != null) {
          setCoords({
            latitude: json.data.profile.latitude,
            longitude: json.data.profile.longitude,
          });
        }
        setPrefs({
          maxDistanceKm: json.data.preference?.maxDistanceKm ?? 10,
          minimumQuantity: json.data.preference?.minimumQuantity ?? 1,
          maximumQuantity: json.data.preference?.maximumQuantity ?? 100,
          availableFrom: json.data.preference?.availableFrom ?? "",
          availableUntil: json.data.preference?.availableUntil ?? "",
        });
      }
    })();
  }, []);

  function locate() {
    if (!("geolocation" in navigator)) {
      toast("error", "Geolocation not supported by this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        };
        setCoords(next);
        setLocating(false);
        toast("success", `GPS location anchored (${next.latitude}, ${next.longitude}).`);
      },
      () => {
        setLocating(false);
        toast("error", "Could not capture device location.");
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

  async function save() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { preferences: prefs };
      if (coords) {
        payload.latitude = coords.latitude;
        payload.longitude = coords.longitude;
      }
      recipientPreferenceSchema.parse(prefs);

      const res = await fetch("/api/recipient/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast("success", "Preferences saved to matching engine.");
        await updateSession({ verificationStatus: profile?.verificationStatus });
      } else {
        toast("error", json.message ?? "Update failed.");
      }
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Invalid preferences.");
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="skeleton h-12 w-64 rounded-2xl" />
        <div className="skeleton h-56 rounded-3xl" />
        <div className="skeleton h-64 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Top Header */}
      <div className="border-b border-zen-border pb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
            Recipient Preferences Engine
          </span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-ink">
          Organisation Profile & Preferences
        </h1>
        <p className="mt-1 text-sm text-zen-muted font-sans">
          Configure your campus pantry geofence coordinates, automated surplus matching criteria, and daily intake capacity.
        </p>
      </div>

      {/* Verification & Organisation Card */}
      <div className="rounded-3xl border border-zen-border bg-white p-6 sm:p-8 shadow-subtle space-y-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-faint text-primary border border-zen-border">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-serif font-bold text-ink">{profile.organisationName}</h2>
              <StatusBadge status={profile.verificationStatus} />
            </div>
            <p className="mt-1 text-xs text-zen-muted font-mono">
              {profile.verificationStatus === "VERIFIED"
                ? "Verified Organisation — Full claiming authorization active."
                : "Awaiting administrative review. Discovery enabled; claiming will unlock upon approval."}
            </p>
          </div>
        </div>

        <dl className="grid gap-4 text-xs font-mono sm:grid-cols-2 pt-4 border-t border-zen-border">
          <div>
            <dt className="text-zen-muted text-[11px]">Primary Contact</dt>
            <dd className="font-semibold text-ink text-sm mt-0.5">{profile.name}</dd>
          </div>
          <div>
            <dt className="text-zen-muted text-[11px]">Contact Email</dt>
            <dd className="font-semibold text-ink text-sm mt-0.5 truncate">{profile.email}</dd>
          </div>
          <div>
            <dt className="text-zen-muted text-[11px]">Phone</dt>
            <dd className="font-semibold text-ink text-sm mt-0.5">{profile.phone || "Not set"}</dd>
          </div>
          <div>
            <dt className="text-zen-muted text-[11px]">Registered Since</dt>
            <dd className="font-semibold text-ink text-sm mt-0.5">
              {new Date(profile.createdAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </dd>
          </div>
        </dl>
      </div>

      {/* Geofence Base Location Card */}
      <div className="rounded-3xl border border-zen-border bg-white p-6 sm:p-8 shadow-subtle space-y-4">
        <div className="border-b border-zen-border pb-3">
          <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-ink">
            <MapPin className="h-4 w-4 text-primary" />
            <span>Geofence Base Location</span>
          </h2>
          <p className="mt-1 text-xs text-zen-muted font-sans">
            Used by the atomic routing engine to calculate proximity and notify you when surplus is available within your radius.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div>
            <span className="text-[11px] font-mono text-zen-muted block">Anchored Coordinates:</span>
            <p className="font-mono text-sm font-bold text-ink mt-0.5">
              {coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : "Default Campus Grid"}
            </p>
          </div>

          <button
            onClick={locate}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zen-border bg-white px-4 py-2 text-xs font-semibold text-zen-text shadow-subtle hover:bg-surface-soft active:scale-95 transition-all"
            disabled={locating}
          >
            {locating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden />
            ) : (
              <Crosshair className="h-3.5 w-3.5 text-primary" aria-hidden />
            )}
            <span>Update from Device GPS</span>
          </button>
        </div>
      </div>

      {/* Matching Preferences Form Card */}
      <div className="rounded-3xl border border-zen-border bg-white p-6 sm:p-8 shadow-subtle space-y-6">
        <div className="border-b border-zen-border pb-3">
          <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-ink">
            <SlidersHorizontal className="h-4 w-4 text-primary" aria-hidden />
            <span>Surplus Intake Capacity & Match Criteria</span>
          </h2>
          <p className="mt-1 text-xs text-zen-muted font-sans">
            Fine-tune minimum and maximum portions your community can distribute per rescue batch.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="p-distance" className="block text-xs font-serif font-bold text-ink">
                Max Dispatch Radius: <span className="font-mono text-primary font-bold">{prefs.maxDistanceKm} km</span>
              </label>
              <span className="text-[11px] font-mono text-zen-muted">Transit boundary</span>
            </div>
            <input
              id="p-distance"
              type="range"
              min={1}
              max={50}
              value={prefs.maxDistanceKm}
              onChange={(e) => setPrefs((p) => ({ ...p, maxDistanceKm: Number(e.target.value) }))}
              className="w-full accent-primary"
            />
          </div>

          <div>
            <label htmlFor="p-min" className="block text-xs font-serif font-bold text-ink mb-1.5">
              Minimum Quantity (Portions)
            </label>
            <input
              id="p-min"
              type="number"
              min={1}
              className="w-full rounded-xl border border-zen-border bg-page/30 px-3.5 py-2.5 text-xs font-mono text-zen-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              value={prefs.minimumQuantity}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, minimumQuantity: Number(e.target.value) || 1 }))
              }
            />
          </div>

          <div>
            <label htmlFor="p-max" className="block text-xs font-serif font-bold text-ink mb-1.5">
              Maximum Intake Capacity (Portions)
            </label>
            <input
              id="p-max"
              type="number"
              min={1}
              className="w-full rounded-xl border border-zen-border bg-page/30 px-3.5 py-2.5 text-xs font-mono text-zen-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              value={prefs.maximumQuantity}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, maximumQuantity: Number(e.target.value) || 1 }))
              }
            />
          </div>

          <div>
            <label htmlFor="p-from" className="block text-xs font-serif font-bold text-ink mb-1.5">
              Daily Distribution Hours (From)
            </label>
            <input
              id="p-from"
              type="time"
              className="w-full rounded-xl border border-zen-border bg-page/30 px-3.5 py-2.5 text-xs font-mono text-zen-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              value={prefs.availableFrom}
              onChange={(e) => setPrefs((p) => ({ ...p, availableFrom: e.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="p-until" className="block text-xs font-serif font-bold text-ink mb-1.5">
              Daily Distribution Hours (Until)
            </label>
            <input
              id="p-until"
              type="time"
              className="w-full rounded-xl border border-zen-border bg-page/30 px-3.5 py-2.5 text-xs font-mono text-zen-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              value={prefs.availableUntil}
              onChange={(e) => setPrefs((p) => ({ ...p, availableUntil: e.target.value }))}
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white shadow-soft hover:bg-primary-hover active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <CheckCircle2 className="h-4 w-4" aria-hidden />
            )}
            <span>{saving ? "Saving Preferences…" : "Save Matching Preferences"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
