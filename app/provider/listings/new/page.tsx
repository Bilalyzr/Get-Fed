"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Crosshair, Loader2, PlusCircle, Info } from "lucide-react";
import { createListingSchema, foodCategories, type CreateListingInput } from "@/lib/validators";
import { useToast } from "@/components/Toast";

// ---------------------------------------------------------------------------
// Create surplus listing (PRD §14/FR): full field set with shared Zod
// validation; backend re-validates authoritatively.
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  COOKED_MEALS: "Cooked meals",
  BAKERY: "Bakery",
  PACKAGED: "Packaged food",
  PRODUCE: "Fresh produce",
  DAIRY: "Dairy",
  BEVERAGES: "Beverages",
  OTHER: "Other",
};

export default function NewListingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [locating, setLocating] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateListingInput>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      foodName: "",
      description: "",
      category: "COOKED_MEALS",
      totalQuantity: 50,
      unit: "PORTIONS",
      preparedAt: new Date(Date.now() - 30 * 60_000),
      availableFrom: new Date(),
      pickupDeadline: new Date(Date.now() + 90 * 60_000),
      pickupAddress: "",
      latitude: undefined,
      longitude: undefined,
      notes: "",
      allergenNotes: "",
      packagingType: "",
    },
  });

  const latitude = watch("latitude");
  const longitude = watch("longitude");

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      toast("error", "Geolocation is not supported by this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("latitude", Number(pos.coords.latitude.toFixed(6)), {
          shouldValidate: true,
        });
        setValue("longitude", Number(pos.coords.longitude.toFixed(6)), {
          shouldValidate: true,
        });
        setLocating(false);
        toast("success", "Location captured from your device.");
      },
      () => {
        setLocating(false);
        toast("error", "Could not get your location. Please enter coordinates manually.");
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
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
      toast("success", "Listing published — nearby recipients are being notified.");
      router.push(`/provider/listings/${json.data.listing.id}`);
    } catch {
      toast("error", "Network error — please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-extrabold text-stone-900">Create surplus listing</h1>
      <p className="mt-1 text-sm text-stone-500">
        Publish in under a minute. Nearby verified recipients get notified automatically.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="card mt-6 space-y-5 p-5 sm:p-6" noValidate>
        {/* Food details */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-bold uppercase tracking-wide text-stone-500">
            Food details
          </legend>

          <div>
            <label htmlFor="foodName" className="label">
              Food name <span className="text-rose-600">*</span>
            </label>
            <input
              id="foodName"
              className="input"
              placeholder="Vegetable Biryani"
              aria-invalid={!!errors.foodName}
              {...register("foodName")}
            />
            {errors.foodName && <p className="field-error" role="alert">{errors.foodName.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className="label">
              Description <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="description"
              rows={3}
              className="input"
              placeholder="Fresh vegetarian biryani from the alumni meet buffet, packed in hygienic containers."
              aria-invalid={!!errors.description}
              {...register("description")}
            />
            {errors.description && (
              <p className="field-error" role="alert">{errors.description.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="category" className="label">
                Category <span className="text-rose-600">*</span>
              </label>
              <select id="category" className="input" {...register("category")}>
                {foodCategories.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="totalQuantity" className="label">
                Total quantity <span className="text-rose-600">*</span>
              </label>
              <input
                id="totalQuantity"
                type="number"
                min={1}
                className="input"
                aria-invalid={!!errors.totalQuantity}
                {...register("totalQuantity")}
              />
              {errors.totalQuantity && (
                <p className="field-error" role="alert">{errors.totalQuantity.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="unit" className="label">
                Unit <span className="text-rose-600">*</span>
              </label>
              <select id="unit" className="input" {...register("unit")}>
                <option value="PORTIONS">Portions</option>
                <option value="KG">Kg</option>
                <option value="PACKETS">Packets</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* Timing */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-bold uppercase tracking-wide text-stone-500">
            Timing <span className="text-rose-600">*</span>
          </legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="preparedAt" className="label">
                Prepared at
              </label>
              <input
                id="preparedAt"
                type="datetime-local"
                className="input"
                aria-invalid={!!errors.preparedAt}
                {...register("preparedAt")}
              />
              {errors.preparedAt && (
                <p className="field-error" role="alert">{errors.preparedAt.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="availableFrom" className="label">
                Available from
              </label>
              <input
                id="availableFrom"
                type="datetime-local"
                className="input"
                aria-invalid={!!errors.availableFrom}
                {...register("availableFrom")}
              />
              {errors.availableFrom && (
                <p className="field-error" role="alert">{errors.availableFrom.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="pickupDeadline" className="label">
                Pickup deadline
              </label>
              <input
                id="pickupDeadline"
                type="datetime-local"
                className="input"
                aria-invalid={!!errors.pickupDeadline}
                {...register("pickupDeadline")}
              />
              {errors.pickupDeadline && (
                <p className="field-error" role="alert">{errors.pickupDeadline.message}</p>
              )}
            </div>
          </div>
          <p className="flex items-start gap-2 rounded-lg bg-sky-50 p-3 text-xs text-sky-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            The listing disappears from discovery automatically once the pickup
            deadline passes — expired food can never be claimed.
          </p>
        </fieldset>

        {/* Location */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-bold uppercase tracking-wide text-stone-500">
            Pickup location <span className="text-rose-600">*</span>
          </legend>
          <div>
            <label htmlFor="pickupAddress" className="label">
              Address <span className="text-rose-600">*</span>
            </label>
            <input
              id="pickupAddress"
              className="input"
              placeholder="Main Canteen, Block A, University Campus"
              aria-invalid={!!errors.pickupAddress}
              {...register("pickupAddress")}
            />
            {errors.pickupAddress && (
              <p className="field-error" role="alert">{errors.pickupAddress.message}</p>
            )}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-32">
              <label htmlFor="latitude" className="label">
                Latitude
              </label>
              <input
                id="latitude"
                type="number"
                step="0.000001"
                className="input"
                aria-invalid={!!errors.latitude}
                {...register("latitude", { valueAsNumber: true })}
              />
              {errors.latitude && (
                <p className="field-error" role="alert">{errors.latitude.message}</p>
              )}
            </div>
            <div className="w-32">
              <label htmlFor="longitude" className="label">
                Longitude
              </label>
              <input
                id="longitude"
                type="number"
                step="0.000001"
                className="input"
                aria-invalid={!!errors.longitude}
                {...register("longitude", { valueAsNumber: true })}
              />
              {errors.longitude && (
                <p className="field-error" role="alert">{errors.longitude.message}</p>
              )}
            </div>
            <button
              type="button"
              onClick={useMyLocation}
              className="btn-secondary"
              disabled={locating}
            >
              {locating ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Crosshair className="h-4 w-4" aria-hidden />
              )}
              Use my location
            </button>
            {latitude != null && longitude != null && (
              <span className="text-xs text-green-700">
                ✓ {latitude}, {longitude}
              </span>
            )}
          </div>
        </fieldset>

        {/* Optional details */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-bold uppercase tracking-wide text-stone-500">
            Optional details
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="allergenNotes" className="label">
                Allergen notes
              </label>
              <input
                id="allergenNotes"
                className="input"
                placeholder="Contains nuts, dairy"
                {...register("allergenNotes")}
              />
            </div>
            <div>
              <label htmlFor="packagingType" className="label">
                Packaging type
              </label>
              <input
                id="packagingType"
                className="input"
                placeholder="Individual sealed boxes"
                {...register("packagingType")}
              />
            </div>
          </div>
          <div>
            <label htmlFor="notes" className="label">
              Notes for collectors
            </label>
            <textarea
              id="notes"
              rows={2}
              className="input"
              placeholder="Please bring your own carry bags. Ask for the canteen manager at the counter."
              {...register("notes")}
            />
          </div>
        </fieldset>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <PlusCircle className="h-5 w-5" aria-hidden />
          )}
          {isSubmitting ? "Publishing…" : "Publish listing"}
        </button>
      </form>
    </div>
  );
}
