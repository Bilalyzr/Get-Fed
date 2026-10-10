"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ShieldCheck, Crosshair, SlidersHorizontal, Loader2 } from "lucide-react";
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

  const [prefs, setPrefs] = useState({
    maxDistanceKm: 10,
    minimumQuantity: 1,
    maximumQuantity: 100,
    availableFrom: "",
    availableUntil: "",
  });

  function locate() {
    if (!("geolocation" in navigator)) {
      toast("error", "Geolocation not supported.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        });
        setLocating(false);
      },
      () => {
        setLocating(false);
        toast("error", "Could not get location.");
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
      // Validate preferences client-side first (server re-validates).
      recipientPreferenceSchema.parse(prefs);

      const res = await fetch("/api/recipient/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast("success", "Profile updated.");
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
    return <div className="skeleton h-96" />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-stone-900">Profile & preferences</h1>
        <p className="text-sm text-stone-500">
          Your organisation details and matching preferences.
        </p>
      </div>

      {/* Verification card */}
      <div className="card flex items-start gap-4 p-5">
        <span className="rounded-xl bg-stone-100 p-2.5 text-stone-600" aria-hidden>
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-stone-900">{profile.organisationName}</p>
            <StatusBadge status={profile.verificationStatus} />
          </div>
          <p className="mt-1 text-sm text-stone-500">
            {profile.verificationStatus === "VERIFIED"
              ? "Verified — you can discover and claim surplus food."
              : "Pending administrator verification. You can browse, but not claim."}
          </p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-stone-400">Contact</dt>
              <dd className="text-stone-700">{profile.name}</dd>
            </div>
            <div>
              <dt className="text-stone-400">Member since</dt>
              <dd className="text-stone-700">
                {new Date(profile.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Location */}
      <div className="card p-5">
        <h2 className="font-bold text-stone-900">Base location</h2>
        <p className="mt-1 text-sm text-stone-500">
          Used for distance matching. Exact location is only used for matching
          — providers never see your private details.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={locate} className="btn-secondary" disabled={locating}>
            {locating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Crosshair className="h-4 w-4" aria-hidden />
            )}
            Update from device
          </button>
          {coords && (
            <span className="text-sm text-green-700">
              {coords.latitude}, {coords.longitude}
            </span>
          )}
        </div>
      </div>

      {/* Matching preferences (PRD §36) */}
      <div className="card p-5">
        <h2 className="flex items-center gap-2 font-bold text-stone-900">
          <SlidersHorizontal className="h-4 w-4 text-stone-400" aria-hidden />
          Matching preferences
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="p-distance" className="label">
              Max distance: {prefs.maxDistanceKm} km
            </label>
            <input
              id="p-distance"
              type="range"
              min={1}
              max={50}
              value={prefs.maxDistanceKm}
              onChange={(e) => setPrefs((p) => ({ ...p, maxDistanceKm: Number(e.target.value) }))}
              className="w-full accent-green-700"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="p-min" className="label">
                Min quantity
              </label>
              <input
                id="p-min"
                type="number"
                min={1}
                className="input"
                value={prefs.minimumQuantity}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, minimumQuantity: Number(e.target.value) || 1 }))
                }
              />
            </div>
            <div>
              <label htmlFor="p-max" className="label">
                Max quantity
              </label>
              <input
                id="p-max"
                type="number"
                min={1}
                className="input"
                value={prefs.maximumQuantity}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, maximumQuantity: Number(e.target.value) || 1 }))
                }
              />
            </div>
          </div>
          <div>
            <label htmlFor="p-from" className="label">
              Available from (daily)
            </label>
            <input
              id="p-from"
              type="time"
              className="input"
              value={prefs.availableFrom}
              onChange={(e) => setPrefs((p) => ({ ...p, availableFrom: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="p-until" className="label">
              Available until (daily)
            </label>
            <input
              id="p-until"
              type="time"
              className="input"
              value={prefs.availableUntil}
              onChange={(e) => setPrefs((p) => ({ ...p, availableUntil: e.target.value }))}
            />
          </div>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary mt-5">
          {saving ? "Saving…" : "Save preferences"}
        </button>
      </div>
    </div>
  );
}
