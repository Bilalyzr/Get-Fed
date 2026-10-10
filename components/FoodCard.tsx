"use client";

import Link from "next/link";
import { MapPin, Utensils, Clock3, Navigation } from "lucide-react";
import { CountdownTimer } from "@/components/CountdownTimer";
import { StatusBadge } from "@/components/StatusBadge";
import { TiltedCard } from "@/components/reactbits";

// ---------------------------------------------------------------------------
// Food discovery card (PRD §18/§74): name, quantity, prepared time, deadline,
// distance, category, actions (View / Claim / Directions).
// ---------------------------------------------------------------------------

export type FoodCardData = {
  id: string;
  foodName: string;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  unit: string;
  preparedAt: string;
  pickupDeadline: string;
  pickupAddress: string;
  latitude?: number;
  longitude?: number;
  providerOrganisation: string;
  distanceKm: number | null;
  status: string;
};

const CATEGORY_EMOJI: Record<string, string> = {
  COOKED_MEALS: "🍛",
  BAKERY: "🥖",
  PACKAGED: "📦",
  PRODUCE: "🥗",
  DAIRY: "🥛",
  BEVERAGES: "🧃",
  OTHER: "🍽️",
};

export function FoodCard({
  food,
  onClaim,
  claimDisabled,
}: {
  food: FoodCardData;
  onClaim?: (food: FoodCardData) => void;
  claimDisabled?: boolean;
}) {
  const directionsUrl = `https://www.openstreetmap.org/directions?to=${encodeURIComponent(
    food.pickupAddress
  )}`;

  return (
    <TiltedCard maxTilt={6} className="h-full rounded-2xl">
      <article className="card flex h-full flex-col overflow-hidden rounded-2xl transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-3 border-b border-stone-100 p-4 pb-3">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 truncate text-base font-bold text-stone-900">
              <span aria-hidden>{CATEGORY_EMOJI[food.category] ?? "🍽️"}</span>
              {food.foodName}
            </h3>
            <p className="mt-0.5 truncate text-sm text-stone-500">
              {food.providerOrganisation}
            </p>
          </div>
          <StatusBadge status={food.status} />
        </div>

        <div className="flex-1 space-y-2.5 p-4 text-sm text-stone-600">
          <p className="flex items-center gap-2 font-semibold text-stone-900">
            <Utensils className="h-4 w-4 shrink-0 text-green-700" aria-hidden />
            {food.availableQuantity} of {food.totalQuantity}{" "}
            {food.unit.toLowerCase()} available
          </p>
          <p className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
            Prepared {new Date(food.preparedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
              {food.distanceKm != null ? `${food.distanceKm} km away` : food.pickupAddress}
            </span>
          </p>
          <p className="flex items-center gap-2">
            <CountdownTimer deadline={food.pickupDeadline} expiredLabel="Pickup window closed" />
            <span className="text-stone-400">
              (by{" "}
              {new Date(food.pickupDeadline).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
              )
            </span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-stone-100 p-3">
          <Link
            href={`/recipient/food/${food.id}`}
            className="btn-secondary !px-2 !py-2 text-xs sm:text-sm"
          >
            View
          </Link>
          <button
            type="button"
            onClick={() => onClaim?.(food)}
            disabled={claimDisabled || food.availableQuantity <= 0}
            className="btn-primary !px-2 !py-2 text-xs sm:text-sm"
          >
            Claim
          </button>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary !px-2 !py-2 text-xs sm:text-sm"
            aria-label={`Directions to ${food.pickupAddress}`}
          >
            <Navigation className="h-4 w-4" aria-hidden />
            Directions
          </a>
        </div>
      </article>
    </TiltedCard>
  );
}
