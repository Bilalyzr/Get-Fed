"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Crosshair,
  Loader2,
  PlusCircle,
  Info,
  ArrowLeft,
  Utensils,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { createListingSchema, foodCategories, type CreateListingInput } from "@/lib/validators";
import { useToast } from "@/components/Toast";

const CATEGORY_LABELS: Record<string, string> = {
  COOKED_MEALS: "Cooked meals",
  BAKERY: "Bakery",
  PACKAGED: "Packaged food",
  PRODUCE: "Fresh produce",
  DAIRY: "Dairy",
  BEVERAGES: "Beverages",
  OTHER: "Other",
};

// Converts a JavaScript Date into "YYYY-MM-DDTHH:mm" for native datetime-local inputs
function toLocalDatetimeString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function NewListingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [locating, setLocating] = useState(false);
  const [coordsCaptured, setCoordsCaptured] = useState(true);

  // Initial local datetime strings
  const initialPreparedAt = toLocalDatetimeString(new Date(Date.now() - 30 * 60_000));
  const initialAvailableFrom = toLocalDatetimeString(new Date());
  const initialPickupDeadline = toLocalDatetimeString(new Date(Date.now() + 90 * 60_000));

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateListingInput>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      foodName: "",
      description: "",
      category: "COOKED_MEALS",
      totalQuantity: 30,
      unit: "PORTIONS",
      // Provide valid ISO string formats so datetime-local inputs never freeze or cast [object Date]
      preparedAt: initialPreparedAt as unknown as Date,
      availableFrom: initialAvailableFrom as unknown as Date,
      pickupDeadline: initialPickupDeadline as unknown as Date,
      pickupAddress: "Central Campus Dining, Main Hall B, University Campus",
      latitude: 12.9716,
      longitude: 77.5946,
      notes: "Please arrive at the service dock with thermal carriers.",
      allergenNotes: "Contains dairy and gluten; prepared in a nut-free facility.",
      packagingType: "Individually sealed meal boxes",
    },
  });

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      toast("error", "Geolocation is not supported by this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setValue("latitude", lat, { shouldValidate: true });
        setValue("longitude", lng, { shouldValidate: true });
        setLocating(false);
        setCoordsCaptured(true);
        toast("success", `GPS Location captured (${lat}, ${lng}).`);
      },
      () => {
        setLocating(false);
        toast("error", "Could not get your GPS location. Kept default campus coordinates.");
      },
      { enableHighAccuracy: true, timeout: 8_000 }
    );
  }

  function applyPreset(preset: "biryani" | "bakery" | "sandwiches") {
    if (preset === "biryani") {
      setValue("foodName", "Steamed Vegetable Biryani & Raita", { shouldValidate: true });
      setValue("description", "Fresh vegetarian biryani from the campus dining service, packed in hygienic insulated containers.", { shouldValidate: true });
      setValue("category", "COOKED_MEALS", { shouldValidate: true });
      setValue("totalQuantity", 45, { shouldValidate: true });
      setValue("unit", "PORTIONS", { shouldValidate: true });
      setValue("allergenNotes", "Contains dairy (raita). Nut-free.", { shouldValidate: true });
      setValue("packagingType", "Steam table trays & individual containers", { shouldValidate: true });
    } else if (preset === "bakery") {
      setValue("foodName", "Artisan Bread Loaves & Pastries", { shouldValidate: true });
      setValue("description", "Surplus baked sourdough, multigrain rolls, and croissants prepared this morning at campus bakery.", { shouldValidate: true });
      setValue("category", "BAKERY", { shouldValidate: true });
      setValue("totalQuantity", 25, { shouldValidate: true });
      setValue("unit", "PACKETS", { shouldValidate: true });
      setValue("allergenNotes", "Contains wheat gluten and milk.", { shouldValidate: true });
      setValue("packagingType", "Eco-friendly kraft paper bread bags", { shouldValidate: true });
    } else if (preset === "sandwiches") {
      setValue("foodName", "Club Sandwiches & Fresh Wraps", { shouldValidate: true });
      setValue("description", "Packaged deli sandwiches and vegetable rolls from event catering.", { shouldValidate: true });
      setValue("category", "PACKAGED", { shouldValidate: true });
      setValue("totalQuantity", 35, { shouldValidate: true });
      setValue("unit", "PORTIONS", { shouldValidate: true });
      setValue("allergenNotes", "Contains eggs, dairy, wheat.", { shouldValidate: true });
      setValue("packagingType", "Individually wrapped tamper-evident boxes", { shouldValidate: true });
    }
    toast("success", "Template preset applied!");
  }

  async function onSubmit(data: CreateListingInput) {
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) {
        toast("error", json.message ?? "Could not create listing.");
        return;
      }
      toast("success", "Surplus batch published — nearby verified recipients notified.");
      router.push(`/provider/listings/${json.data.listing.id}`);
    } catch {
      toast("error", "Network error — please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/provider/listings"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zen-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Listings Inventory</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zen-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
              Surplus Dispatch Manifest
            </span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-ink">
            Create Surplus Listing
          </h1>
          <p className="mt-1 text-sm text-zen-muted">
            Log surplus portions before service windows close. Verified pantries within your geofence receive instant rescue alerts.
          </p>
        </div>
      </div>

      {/* Quick Templates Bar */}
      <div className="rounded-2xl border border-zen-border bg-white p-4 shadow-subtle">
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-1.5 text-xs font-serif font-bold text-ink">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Fast-Fill Kitchen Presets:</span>
          </span>
          <span className="text-[11px] font-mono text-zen-muted">1-Click Auto-Populate</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset("biryani")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zen-border bg-page px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-soft active:scale-95 transition-all"
          >
            <Utensils className="h-3.5 w-3.5 text-primary" />
            <span>Vegetable Biryani (Buffet)</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset("bakery")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zen-border bg-page px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-soft active:scale-95 transition-all"
          >
            <span>Bakery Loaves & Pastries</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset("sandwiches")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zen-border bg-page px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-soft active:scale-95 transition-all"
          >
            <span>Boxed Club Sandwiches</span>
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="rounded-3xl border border-zen-border bg-white p-6 sm:p-8 shadow-subtle space-y-6" noValidate>
        {/* Section 1: Food Details */}
        <fieldset className="space-y-4">
          <legend className="font-serif text-lg font-bold text-ink flex items-center gap-2 border-b border-zen-border pb-2 w-full">
            <Utensils className="h-4 w-4 text-primary" />
            <span>1. Meal Specifications</span>
          </legend>

          <div>
            <label htmlFor="foodName" className="block text-xs font-serif font-bold text-ink mb-1.5">
              Food Item Name <span className="text-rose-600">*</span>
            </label>
            <input
              id="foodName"
              className="w-full rounded-xl border border-zen-border bg-page/30 px-3.5 py-2.5 text-sm font-sans text-zen-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              placeholder="e.g. Steamed Basmati Rice & Paneer Curry"
              aria-invalid={!!errors.foodName}
              {...register("foodName")}
            />
            {errors.foodName && <p className="mt-1 text-xs font-mono text-rose-600">{errors.foodName.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-serif font-bold text-ink mb-1.5">
              Description & Preparation Notes <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="description"
              rows={3}
              className="w-full rounded-xl border border-zen-border bg-page/30 px-3.5 py-2.5 text-sm font-sans text-zen-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              placeholder="Freshly packaged surplus from midday service, maintained in temperature-regulated containers."
              aria-invalid={!!errors.description}
              {...register("description")}
            />
            {errors.description && (
              <p className="mt-1 text-xs font-mono text-rose-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="category" className="block text-xs font-serif font-bold text-ink mb-1.5">
                Category <span className="text-rose-600">*</span>
              </label>
              <select
                id="category"
                className="w-full rounded-xl border border-zen-border bg-page/30 px-3.5 py-2.5 text-xs font-mono text-zen-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                {...register("category")}
              >
                {foodCategories.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="totalQuantity" className="block text-xs font-serif font-bold text-ink mb-1.5">
                Total Quantity <span className="text-rose-600">*</span>
              </label>
              <input
                id="totalQuantity"
                type="number"
                min={1}
                className="w-full rounded-xl border border-zen-border bg-page/30 px-3.5 py-2.5 text-sm font-mono text-zen-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                aria-invalid={!!errors.totalQuantity}
                {...register("totalQuantity")}
              />
              {errors.totalQuantity && (
                <p className="mt-1 text-xs font-mono text-rose-600">{errors.totalQuantity.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="unit" className="block text-xs font-serif font-bold text-ink mb-1.5">
                Unit Metric <span className="text-rose-600">*</span>
              </label>
              <select
                id="unit"
                className="w-full rounded-xl border border-zen-border bg-page/30 px-3.5 py-2.5 text-xs font-mono text-zen-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                {...register("unit")}
              >
                <option value="PORTIONS">Portions</option>
                <option value="KG">Kilograms (Kg)</option>
                <option value="PACKETS">Packets / Boxes</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* Section 2: Timing & Perishability Windows */}
        <fieldset className="space-y-4">
          <legend className="font-serif text-lg font-bold text-ink flex items-center gap-2 border-b border-zen-border pb-2 w-full">
            <Clock className="h-4 w-4 text-primary" />
            <span>2. Perishability & Pickup Window</span>
          </legend>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="preparedAt" className="block text-xs font-serif font-bold text-ink mb-1.5">
                Prepared At
              </label>
              <input
                id="preparedAt"
                type="datetime-local"
                className="w-full rounded-xl border border-zen-border bg-page/30 px-3 py-2 text-xs font-mono text-zen-text focus:border-primary focus:bg-white focus:outline-none transition-all"
                aria-invalid={!!errors.preparedAt}
                {...register("preparedAt")}
              />
              {errors.preparedAt && (
                <p className="mt-1 text-xs font-mono text-rose-600">{errors.preparedAt.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="availableFrom" className="block text-xs font-serif font-bold text-ink mb-1.5">
                Available From
              </label>
              <input
                id="availableFrom"
                type="datetime-local"
                className="w-full rounded-xl border border-zen-border bg-page/30 px-3 py-2 text-xs font-mono text-zen-text focus:border-primary focus:bg-white focus:outline-none transition-all"
                aria-invalid={!!errors.availableFrom}
                {...register("availableFrom")}
              />
              {errors.availableFrom && (
                <p className="mt-1 text-xs font-mono text-rose-600">{errors.availableFrom.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="pickupDeadline" className="block text-xs font-serif font-bold text-ink mb-1.5">
                Pickup Cutoff Deadline <span className="text-rose-600">*</span>
              </label>
              <input
                id="pickupDeadline"
                type="datetime-local"
                className="w-full rounded-xl border border-primary/40 bg-page/40 px-3 py-2 text-xs font-mono font-semibold text-primary focus:border-primary focus:bg-white focus:outline-none transition-all"
                aria-invalid={!!errors.pickupDeadline}
                {...register("pickupDeadline")}
              />
              {errors.pickupDeadline && (
                <p className="mt-1 text-xs font-mono text-rose-600">{errors.pickupDeadline.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl border border-primary/25 bg-primary-faint/30 p-3.5 text-xs text-ink font-mono">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>
              Perishability rule: Listings automatically expire and vanish from recipient discovery once the pickup deadline passes.
            </span>
          </div>
        </fieldset>

        {/* Section 3: Geofence & Location */}
        <fieldset className="space-y-4">
          <legend className="font-serif text-lg font-bold text-ink flex items-center gap-2 border-b border-zen-border pb-2 w-full">
            <MapPin className="h-4 w-4 text-primary" />
            <span>3. Service Dock & Coordinates</span>
          </legend>

          <div>
            <label htmlFor="pickupAddress" className="block text-xs font-serif font-bold text-ink mb-1.5">
              Pickup Dock Address <span className="text-rose-600">*</span>
            </label>
            <input
              id="pickupAddress"
              className="w-full rounded-xl border border-zen-border bg-page/30 px-3.5 py-2.5 text-sm font-sans text-zen-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              placeholder="e.g. Central Dining Kitchen Dock, Gate 3, Campus South"
              aria-invalid={!!errors.pickupAddress}
              {...register("pickupAddress")}
            />
            {errors.pickupAddress && (
              <p className="mt-1 text-xs font-mono text-rose-600">{errors.pickupAddress.message}</p>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-3 pt-1">
            <div className="w-36">
              <label htmlFor="latitude" className="block text-xs font-serif font-bold text-ink mb-1">
                Latitude
              </label>
              <input
                id="latitude"
                type="number"
                step="0.000001"
                className="w-full rounded-xl border border-zen-border bg-page/30 px-3 py-1.5 text-xs font-mono text-zen-text focus:border-primary focus:outline-none"
                aria-invalid={!!errors.latitude}
                {...register("latitude", { valueAsNumber: true })}
              />
            </div>
            <div className="w-36">
              <label htmlFor="longitude" className="block text-xs font-serif font-bold text-ink mb-1">
                Longitude
              </label>
              <input
                id="longitude"
                type="number"
                step="0.000001"
                className="w-full rounded-xl border border-zen-border bg-page/30 px-3 py-1.5 text-xs font-mono text-zen-text focus:border-primary focus:outline-none"
                aria-invalid={!!errors.longitude}
                {...register("longitude", { valueAsNumber: true })}
              />
            </div>
            <button
              type="button"
              onClick={useMyLocation}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zen-border bg-white px-3.5 py-2 text-xs font-semibold text-zen-text shadow-subtle hover:bg-surface-soft active:scale-95 transition-all"
              disabled={locating}
            >
              {locating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden />
              ) : (
                <Crosshair className="h-3.5 w-3.5 text-primary" aria-hidden />
              )}
              <span>Capture GPS</span>
            </button>
            {coordsCaptured && (
              <span className="flex items-center gap-1 text-xs font-mono text-primary font-semibold py-2">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Geofence Anchored</span>
              </span>
            )}
          </div>
        </fieldset>

        {/* Section 4: Allergens & Packaging */}
        <fieldset className="space-y-4">
          <legend className="font-serif text-lg font-bold text-ink flex items-center gap-2 border-b border-zen-border pb-2 w-full">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>4. Dietary & Handling Notes</span>
          </legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="allergenNotes" className="block text-xs font-serif font-bold text-ink mb-1.5">
                Allergen & Dietary Declarations
              </label>
              <input
                id="allergenNotes"
                className="w-full rounded-xl border border-zen-border bg-page/30 px-3.5 py-2 text-xs font-sans text-zen-text focus:border-primary focus:bg-white focus:outline-none"
                placeholder="e.g. Vegetarian, Halal, Contains Dairy, Nut-Free"
                {...register("allergenNotes")}
              />
            </div>

            <div>
              <label htmlFor="packagingType" className="block text-xs font-serif font-bold text-ink mb-1.5">
                Packaging & Transport Format
              </label>
              <input
                id="packagingType"
                className="w-full rounded-xl border border-zen-border bg-page/30 px-3.5 py-2 text-xs font-sans text-zen-text focus:border-primary focus:bg-white focus:outline-none"
                placeholder="e.g. Individually sealed meal boxes"
                {...register("packagingType")}
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-xs font-serif font-bold text-ink mb-1.5">
              Pickup Instructions for Drivers & Pantries
            </label>
            <textarea
              id="notes"
              rows={2}
              className="w-full rounded-xl border border-zen-border bg-page/30 px-3.5 py-2 text-xs font-sans text-zen-text focus:border-primary focus:bg-white focus:outline-none"
              placeholder="e.g. Call service phone upon arrival at Gate 3. Bring thermal carriers."
              {...register("notes")}
            />
          </div>
        </fieldset>

        {/* Submit button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-soft hover:bg-primary-hover active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <PlusCircle className="h-5 w-5" aria-hidden />
            )}
            <span>{isSubmitting ? "Publishing Batch to Campus Grid…" : "Publish Surplus Batch to Grid"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
