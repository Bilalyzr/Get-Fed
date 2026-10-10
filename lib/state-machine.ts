// ---------------------------------------------------------------------------
// Centralized state transition logic (PRD §11, §14).
// Every listing/claim mutation must go through these tables — never set a
// status directly in ad-hoc code.
// ---------------------------------------------------------------------------

import type { ClaimStatus, ListingStatus } from "@prisma/client";

// --------------------------- Listing state machine ---------------------------

/**
 * DRAFT → AVAILABLE → PARTIALLY_RESERVED → FULLY_RESERVED → PICKUP_IN_PROGRESS → COLLECTED
 * AVAILABLE → EXPIRED | CANCELLED
 * PARTIALLY_RESERVED/FULLY_RESERVED → EXPIRED | CANCELLED
 * FULLY_RESERVED/PARTIALLY_RESERVED → AVAILABLE/PARTIALLY_RESERVED (claim cancelled)
 */
const LISTING_TRANSITIONS: Record<ListingStatus, ListingStatus[]> = {
  DRAFT: ["AVAILABLE", "CANCELLED"],
  AVAILABLE: ["PARTIALLY_RESERVED", "FULLY_RESERVED", "EXPIRED", "CANCELLED"],
  PARTIALLY_RESERVED: [
    "AVAILABLE",
    "PARTIALLY_RESERVED", // more claims while still partial
    "FULLY_RESERVED",
    "PICKUP_IN_PROGRESS",
    "EXPIRED",
    "CANCELLED",
  ],
  FULLY_RESERVED: [
    "PARTIALLY_RESERVED",
    "AVAILABLE",
    "PICKUP_IN_PROGRESS",
    "EXPIRED",
    "CANCELLED",
  ],
  PICKUP_IN_PROGRESS: [
    "COLLECTED",
    "PARTIALLY_RESERVED", // some claims cancelled/no-show during pickup
    "FULLY_RESERVED",
    "EXPIRED",
  ],
  COLLECTED: [],
  EXPIRED: [],
  CANCELLED: [],
};

export function canTransitionListing(
  from: ListingStatus,
  to: ListingStatus
): boolean {
  return LISTING_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Derive the availability status from quantities (PRD §67):
 *   available == total            → AVAILABLE
 *   0 < available < total         → PARTIALLY_RESERVED
 *   available == 0                → FULLY_RESERVED
 * Terminal states (COLLECTED/EXPIRED/CANCELLED) never change via quantities.
 */
export function deriveListingStatus(
  current: ListingStatus,
  totalQuantity: number,
  availableQuantity: number
): ListingStatus {
  if (
    current === "COLLECTED" ||
    current === "EXPIRED" ||
    current === "CANCELLED"
  ) {
    return current;
  }
  if (availableQuantity <= 0) return "FULLY_RESERVED";
  if (availableQuantity >= totalQuantity) return "AVAILABLE";
  return "PARTIALLY_RESERVED";
}

// ---------------------------- Claim state machine ----------------------------

/**
 * REQUESTED → RESERVED → PICKUP_IN_PROGRESS → COLLECTED
 * RESERVED → CANCELLED | NO_SHOW | EXPIRED
 * PICKUP_IN_PROGRESS → CANCELLED | NO_SHOW
 */
const CLAIM_TRANSITIONS: Record<ClaimStatus, ClaimStatus[]> = {
  REQUESTED: ["RESERVED", "CANCELLED"],
  RESERVED: [
    "PICKUP_IN_PROGRESS",
    "COLLECTED",
    "CANCELLED",
    "NO_SHOW",
    "EXPIRED",
  ],
  PICKUP_IN_PROGRESS: ["COLLECTED", "CANCELLED", "NO_SHOW"],
  COLLECTED: [],
  CANCELLED: [],
  NO_SHOW: [],
  EXPIRED: [],
};

export function canTransitionClaim(
  from: ClaimStatus,
  to: ClaimStatus
): boolean {
  return CLAIM_TRANSITIONS[from]?.includes(to) ?? false;
}

// ------------------------------- Guard helpers -------------------------------

export class StateTransitionError extends Error {
  constructor(from: string, to: string, entity: string) {
    super(`Invalid ${entity} state transition: ${from} → ${to}`);
    this.name = "StateTransitionError";
  }
}

export function assertListingTransition(
  from: ListingStatus,
  to: ListingStatus
): void {
  if (!canTransitionListing(from, to)) {
    throw new StateTransitionError(from, to, "listing");
  }
}

export function assertClaimTransition(
  from: ClaimStatus,
  to: ClaimStatus
): void {
  if (!canTransitionClaim(from, to)) {
    throw new StateTransitionError(from, to, "claim");
  }
}

/** Statuses in which a listing still accepts new claims. */
export const CLAIMABLE_LISTING_STATUSES: ListingStatus[] = [
  "AVAILABLE",
  "PARTIALLY_RESERVED",
];

/** Statuses in which a claim can still be cancelled by the recipient. */
export const CANCELLABLE_CLAIM_STATUSES: ClaimStatus[] = [
  "REQUESTED",
  "RESERVED",
  "PICKUP_IN_PROGRESS",
];
