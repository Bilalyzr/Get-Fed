"use client";

import React from "react";
import Link from "next/link";
import { MapPin, Utensils, Clock3, Navigation, ArrowRight } from "lucide-react";
import { CountdownTimer } from "@/components/CountdownTimer";
import { StatusBadge } from "@/components/StatusBadge";
import { TiltedCard } from "@/components/reactbits";

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
    <TiltedCard maxTilt={5} className="h-full rounded-2xl">
      <article className="card flex h-full flex-col overflow-hidden rounded-2xl border border-zen-border bg-white transition-all duration-300 hover:border-primary-soft hover:shadow-soft">
        <div className="flex items-start justify-between gap-3 border-b border-zen-border p-4 pb-3 bg-page/30">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 truncate font-serif text-base font-bold text-ink">
              <span aria-hidden>{CATEGORY_EMOJI[food.category] ?? "🍽️"}</span>
              {food.foodName}
            </h3>
            <p className="mt-0.5 truncate text-xs font-mono font-medium text-zen-muted">
              {food.providerOrganisation}
            </p>
          </div>
          <StatusBadge status={food.status} />
        </div>

        <div className="flex-1 space-y-2.5 p-4 text-sm text-zen-text">
          <p className="flex items-center gap-2 font-bold text-ink">
            <Utensils className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="font-mono text-primary">{food.availableQuantity}</span> of {food.totalQuantity}{" "}
            {food.unit.toLowerCase()} available
          </p>
          <p className="flex items-center gap-2 text-xs text-zen-muted">
            <Clock3 className="h-3.5 w-3.5 shrink-0 text-zen-faint" aria-hidden />
            Prepared {new Date(food.preparedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zen-muted">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              {food.distanceKm != null ? `${food.distanceKm} km away` : food.pickupAddress}
            </span>
          </p>
          <div className="pt-1 flex items-center justify-between text-xs">
            <CountdownTimer deadline={food.pickupDeadline} expiredLabel="Pickup window closed" />
            <span className="text-[11px] font-mono text-zen-faint">
              by {new Date(food.pickupDeadline).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-zen-border bg-page/20 p-3">
          <Link
            href={`/recipient/food/${food.id}`}
            className="btn-secondary !px-2 !py-2 text-xs"
          >
            View
          </Link>
          <button
            type="button"
            onClick={() => onClaim?.(food)}
            disabled={claimDisabled || food.availableQuantity <= 0}
            className="btn-primary !px-2 !py-2 text-xs font-semibold"
          >
            Claim
          </button>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary !px-2 !py-2 text-xs"
            aria-label={`Directions to ${food.pickupAddress}`}
          >
            <Navigation className="h-3.5 w-3.5" aria-hidden />
            Route
          </a>
        </div>
      </article>
    </TiltedCard>
  );
}
