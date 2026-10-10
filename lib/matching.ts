// ---------------------------------------------------------------------------
// Rule-based matching engine (PRD §27–§33).
//
// Match Score = 40% Distance + 30% Quantity Compatibility
//             + 20% Time Feasibility + 10% Reliability     (range 0–100)
//
// No ML, no external services — pure, testable scoring functions.
// ---------------------------------------------------------------------------

import type { RecipientPreference, User } from "@prisma/client";
import {
  distanceScore,
  estimateEtaMinutes,
  haversineDistanceKm,
} from "@/lib/distance";

export const MATCH_WEIGHTS = {
  distance: 0.4,
  quantity: 0.3,
  time: 0.2,
  reliability: 0.1,
} as const;

export const PICKUP_BUFFER_MINUTES = 10;

export type ReliabilityStats = { successful: number; total: number };

export type MatchCandidate = {
  recipient: User & { preference: RecipientPreference | null };
  distanceKm: number;
  etaMinutes: number;
  score: number;
  subscores: { distance: number; quantity: number; time: number; reliability: number };
  eligible: boolean;
  reason?: string;
};

export type ListingForMatching = {
  latitude: number;
  longitude: number;
  availableQuantity: number;
  pickupDeadline: Date;
};

// ------------------------------ Sub-scores -----------------------------------

/**
 * Distance subscore — see distance.ts for tier boundaries (PRD §29).
 */
export function calculateDistanceSubscore(distanceKm: number): number {
  return distanceScore(distanceKm);
}

/**
 * Quantity compatibility subscore (PRD §30).
 * Recipients express a preferred min–max window; listings inside the window
 * score 100, out-of-window listings decay proportionally to how far outside
 * they are. Recipients without preferences accept any quantity (score 70).
 */
export function calculateQuantitySubscore(
  listingQuantity: number,
  pref: RecipientPreference | null
): number {
  if (!pref) return 70;
  const min = Math.max(1, pref.minimumQuantity);
  const max = Math.max(min, pref.maximumQuantity);
  if (listingQuantity >= min && listingQuantity <= max) return 100;
  if (listingQuantity < min) {
    // Listing much smaller than the recipient wants → weak match.
    return Math.max(10, Math.round((listingQuantity / min) * 60));
  }
  // Slightly larger than max is fine; massively larger is wasteful.
  const overRatio = listingQuantity / max;
  if (overRatio <= 2) return 80;
  return Math.max(10, Math.round(80 / overRatio));
}

/**
 * Time feasibility (PRD §31): ETA + pickup_buffer < pickup_deadline.
 * Boolean feasibility gate + graduated subscore by slack.
 */
export function isTimeFeasible(
  now: Date,
  etaMinutes: number,
  pickupDeadline: Date,
  bufferMinutes = PICKUP_BUFFER_MINUTES
): boolean {
  const expectedPickupMs =
    now.getTime() + (etaMinutes + bufferMinutes) * 60_000;
  return expectedPickupMs < pickupDeadline.getTime();
}

export function calculateTimeSubscore(
  now: Date,
  etaMinutes: number,
  pickupDeadline: Date
): number {
  if (!isTimeFeasible(now, etaMinutes, pickupDeadline)) return 0;
  const slackMinutes =
    (pickupDeadline.getTime() - now.getTime()) / 60_000 - etaMinutes;
  if (slackMinutes >= 60) return 100;
  if (slackMinutes >= 30) return 85;
  if (slackMinutes >= 15) return 60;
  return 35;
}

/**
 * Reliability (PRD §32): successful pickups / total reserved pickups.
 * Zero-history recipients get a neutral 70 (never divide by zero).
 */
export function calculateReliability(stats: ReliabilityStats): number {
  if (stats.total <= 0) return 70;
  const ratio = stats.successful / stats.total;
  if (ratio >= 0.9) return 100;
  if (ratio >= 0.75) return 85;
  if (ratio >= 0.5) return 60;
  return 25;
}

// ------------------------------ Main scoring ---------------------------------

export function scoreCandidate(
  recipient: User & { preference: RecipientPreference | null },
  listing: ListingForMatching,
  reliabilityStats: ReliabilityStats,
  now = new Date()
): MatchCandidate {
  const distanceKm = haversineDistanceKm(
    { latitude: recipient.latitude ?? 0, longitude: recipient.longitude ?? 0 },
    { latitude: listing.latitude, longitude: listing.longitude }
  );
  const etaMinutes = estimateEtaMinutes(distanceKm);

  const distance = calculateDistanceSubscore(distanceKm);
  const quantity = calculateQuantitySubscore(listing.availableQuantity, recipient.preference);
  const time = calculateTimeSubscore(now, etaMinutes, listing.pickupDeadline);
  const reliability = calculateReliability(reliabilityStats);

  const score = Math.round(
    distance * MATCH_WEIGHTS.distance +
      quantity * MATCH_WEIGHTS.quantity +
      time * MATCH_WEIGHTS.time +
      reliability * MATCH_WEIGHTS.reliability
  );

  let eligible = true;
  let reason: string | undefined;
  if (recipient.verificationStatus !== "VERIFIED") {
    eligible = false;
    reason = "Recipient is not verified";
  } else if (
    recipient.preference &&
    distanceKm > recipient.preference.maxDistanceKm
  ) {
    eligible = false;
    reason = `Outside recipient max distance (${distanceKm.toFixed(1)} km)`;
  } else if (distanceKm > 25) {
    eligible = false;
    reason = "Unreachable distance (> 25 km)";
  } else if (!isTimeFeasible(now, etaMinutes, listing.pickupDeadline)) {
    eligible = false;
    reason = "Cannot arrive before pickup deadline";
  }

  return {
    recipient,
    distanceKm,
    etaMinutes,
    score: Math.max(0, Math.min(100, score)),
    subscores: { distance, quantity, time, reliability },
    eligible,
    reason,
  };
}

export function rankCandidates(candidates: MatchCandidate[]): MatchCandidate[] {
  return candidates
    .filter((c) => c.eligible)
    .sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm);
}
