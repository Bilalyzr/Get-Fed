import { prisma } from "@/lib/prisma";
import { audit, AUDIT_ACTIONS } from "@/lib/audit";
import { createNotifications } from "@/lib/notifications";
import { AppError, ERROR_CODES } from "@/lib/api";
import {
  deriveListingStatus,
  canTransitionListing,
  CLAIMABLE_LISTING_STATUSES,
} from "@/lib/state-machine";
import type { CreateListingInput, UpdateListingInput } from "@/lib/validators";
import type { FoodListing, Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// Listing engine (PRD §9–§11, §14–§16).
// UI → API → Service → Transaction → Database separation is mandatory for
// critical operations (PRD §64).
// ---------------------------------------------------------------------------

const FULL_FIELDS_SELECT = {
  id: true,
  providerId: true,
  foodName: true,
  description: true,
  category: true,
  totalQuantity: true,
  availableQuantity: true,
  unit: true,
  preparedAt: true,
  availableFrom: true,
  pickupDeadline: true,
  pickupAddress: true,
  latitude: true,
  longitude: true,
  image: true,
  allergenNotes: true,
  packagingType: true,
  notes: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FoodListingSelect;

export type FullListing = Prisma.FoodListingGetPayload<{
  select: typeof FULL_FIELDS_SELECT;
}>;

export async function getListing(id: string): Promise<FullListing | null> {
  return prisma.foodListing.findUnique({
    where: { id },
    select: FULL_FIELDS_SELECT,
  });
}

export async function createListing(
  providerId: string,
  input: CreateListingInput
): Promise<FoodListing> {
  const listing = await prisma.foodListing.create({
    data: {
      providerId,
      foodName: input.foodName,
      description: input.description,
      category: input.category,
      totalQuantity: input.totalQuantity,
      availableQuantity: input.totalQuantity,
      unit: input.unit,
      preparedAt: input.preparedAt,
      availableFrom: input.availableFrom,
      pickupDeadline: input.pickupDeadline,
      pickupAddress: input.pickupAddress,
      latitude: input.latitude,
      longitude: input.longitude,
      notes: input.notes || null,
      allergenNotes: input.allergenNotes || null,
      packagingType: input.packagingType || null,
      image: input.image || null,
      status: "AVAILABLE",
    },
  });

  await audit(
    prisma,
    AUDIT_ACTIONS.FOOD_LISTING_CREATED,
    "FoodListing",
    listing.id,
    providerId,
    {
      foodName: listing.foodName,
      totalQuantity: listing.totalQuantity,
      pickupDeadline: listing.pickupDeadline.toISOString(),
    }
  );

  return listing;
}

export async function updateListing(
  listingId: string,
  providerId: string,
  input: UpdateListingInput
): Promise<FoodListing> {
  const listing = await prisma.foodListing.findUnique({ where: { id: listingId } });
  if (!listing) {
    throw new AppError(ERROR_CODES.NOT_FOUND, "Listing not found.", 404);
  }
  if (listing.providerId !== providerId) {
    // PRD §47/§76: recipients (or other providers) cannot modify a listing.
    throw new AppError(
      ERROR_CODES.FORBIDDEN,
      "You can only edit your own listings.",
      403
    );
  }
  if (!["DRAFT", "AVAILABLE", "PARTIALLY_RESERVED"].includes(listing.status)) {
    throw new AppError(
      ERROR_CODES.INVALID_STATE,
      `A listing with status ${listing.status.toLowerCase().replace(/_/g, " ")} can no longer be edited.`,
      409
    );
  }

  const merged = {
    preparedAt: input.preparedAt ?? listing.preparedAt,
    availableFrom: input.availableFrom ?? listing.availableFrom,
    pickupDeadline: input.pickupDeadline ?? listing.pickupDeadline,
  };
  const now = Date.now();
  if (merged.pickupDeadline.getTime() <= now) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      "Pickup deadline must be in the future.",
      422
    );
  }
  if (merged.availableFrom.getTime() > merged.pickupDeadline.getTime()) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      "Available from must be before the pickup deadline.",
      422
    );
  }
  if (merged.preparedAt.getTime() > now + 5 * 60_000) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      "Prepared time cannot be in the future.",
      422
    );
  }

  const updated = await prisma.foodListing.update({
    where: { id: listingId },
    data: {
      ...(input.foodName !== undefined && { foodName: input.foodName }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.preparedAt !== undefined && { preparedAt: input.preparedAt }),
      ...(input.availableFrom !== undefined && { availableFrom: input.availableFrom }),
      ...(input.pickupDeadline !== undefined && { pickupDeadline: input.pickupDeadline }),
      ...(input.pickupAddress !== undefined && { pickupAddress: input.pickupAddress }),
      ...(input.latitude !== undefined && { latitude: input.latitude }),
      ...(input.longitude !== undefined && { longitude: input.longitude }),
      ...(input.notes !== undefined && { notes: input.notes || null }),
      ...(input.allergenNotes !== undefined && { allergenNotes: input.allergenNotes || null }),
      ...(input.packagingType !== undefined && { packagingType: input.packagingType || null }),
      ...(input.image !== undefined && { image: input.image || null }),
    },
  });

  await audit(
    prisma,
    AUDIT_ACTIONS.FOOD_LISTING_UPDATED,
    "FoodListing",
    listingId,
    providerId,
    { fields: Object.keys(input) }
  );

  return updated;
}

/**
 * Provider cancellation (PRD §16/§76):
 *   1. cancel listing, 2. cancel outstanding claims, 3. notify recipients,
 *   4. audit log, 5. QR collection becomes impossible (status guard).
 */
export async function cancelListing(
  listingId: string,
  providerId: string
): Promise<FoodListing> {
  return prisma.$transaction(async (tx) => {
    const listing = await tx.foodListing.findUnique({
      where: { id: listingId },
      include: { claims: true },
    });
    if (!listing) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Listing not found.", 404);
    }
    if (listing.providerId !== providerId) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "You can only cancel your own listings.",
        403
      );
    }
    if (!canTransitionListing(listing.status, "CANCELLED")) {
      throw new AppError(
        ERROR_CODES.INVALID_STATE,
        `A listing with status ${listing.status.toLowerCase().replace(/_/g, " ")} cannot be cancelled.`,
        409
      );
    }

    await tx.foodListing.update({
      where: { id: listingId },
      data: { status: "CANCELLED", availableQuantity: 0 },
    });

    const activeClaims = listing.claims.filter(
      (c) => c.status === "RESERVED" || c.status === "PICKUP_IN_PROGRESS" || c.status === "REQUESTED"
    );
    if (activeClaims.length > 0) {
      await tx.claim.updateMany({
        where: { id: { in: activeClaims.map((c) => c.id) } },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
    }

    await audit(
      tx,
      AUDIT_ACTIONS.FOOD_LISTING_CANCELLED,
      "FoodListing",
      listingId,
      providerId,
      {
        foodName: listing.foodName,
        cancelledClaims: activeClaims.length,
        quantities: activeClaims.map((c) => ({ claimId: c.id, quantity: c.quantity })),
      }
    );

    await createNotifications(tx, [
      ...activeClaims.map((claim) => ({
        userId: claim.recipientId,
        title: "Listing cancelled by provider",
        message: `The provider cancelled "${listing.foodName}". Your reservation for ${claim.quantity} ${listing.unit.toLowerCase()} is no longer valid.`,
        type: "PROVIDER_CANCELLATION" as const,
      })),
    ]);

    return (await tx.foodListing.findUnique({
      where: { id: listingId },
      select: FULL_FIELDS_SELECT,
    })) as FullListing;
  });
}

/**
 * Recompute listing status after a quantity change, inside a transaction.
 * Guarded by canTransitionListing so terminal states are never resurrected.
 */
export async function recomputeListingStatus(
  tx: Prisma.TransactionClient,
  listingId: string
): Promise<FoodListing> {
  const listing = await tx.foodListing.findUnique({ where: { id: listingId } });
  if (!listing) {
    throw new AppError(ERROR_CODES.NOT_FOUND, "Listing not found.", 404);
  }
  const next = deriveListingStatus(
    listing.status,
    listing.totalQuantity,
    listing.availableQuantity
  );
  if (next !== listing.status) {
    if (!canTransitionListing(listing.status, next)) {
      throw new AppError(
        ERROR_CODES.INVALID_STATE,
        `Listing cannot move from ${listing.status} to ${next}.`,
        409
      );
    }
    return tx.foodListing.update({
      where: { id: listingId },
      data: { status: next },
    });
  }
  return listing;
}

/** True when a listing still accepts claims (used as a claim precondition). */
export function isClaimable(listing: FoodListing, now = new Date()): boolean {
  return (
    CLAIMABLE_LISTING_STATUSES.includes(listing.status) &&
    listing.availableQuantity > 0 &&
    listing.pickupDeadline.getTime() > now.getTime()
  );
}
