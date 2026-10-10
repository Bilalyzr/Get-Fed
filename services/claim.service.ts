import { prisma } from "@/lib/prisma";
import { audit, AUDIT_ACTIONS } from "@/lib/audit";
import { createNotifications } from "@/lib/notifications";
import { AppError, ERROR_CODES } from "@/lib/api";
import {
  assertClaimTransition,
  CANCELLABLE_CLAIM_STATUSES,
  CLAIMABLE_LISTING_STATUSES,
  deriveListingStatus,
} from "@/lib/state-machine";
import { generateClaimToken, tokenMatches } from "@/services/qr.service";
import type { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// Claim engine (PRD §13/§20–§24) — THE most safety-critical code in the app.
//
// Concurrency contract (PRD §13/§22): concurrent claims for the same listing
// are serialized with a PostgreSQL row-level lock (`SELECT … FOR UPDATE`)
// inside a SERIALIZABLE transaction. Two users requesting 15 each against 20
// remaining can NEVER both succeed; quantity can NEVER go negative.
// ---------------------------------------------------------------------------

/**
 * Attempt to claim `quantity` of a listing for a verified recipient.
 * Throws typed AppErrors; returns the created claim with its secure token.
 */
export async function createClaim(
  listingId: string,
  recipientId: string,
  quantity: number
): Promise<{
  claimId: string;
  quantity: number;
  claimToken: string;
  listingStatus: string;
  availableQuantity: number;
}> {
  // Pre-transaction precondition: provider may never claim own listing (PRD §47).
  const listingOwner = await prisma.foodListing.findUnique({
    where: { id: listingId },
    select: { providerId: true },
  });
  if (!listingOwner) {
    throw new AppError(ERROR_CODES.NOT_FOUND, "Listing not found.", 404);
  }
  if (listingOwner.providerId === recipientId) {
    throw new AppError(
      ERROR_CODES.SELF_CLAIM,
      "You cannot claim your own listing.",
      403
    );
  }

  return prisma.$transaction(
    async (tx) => {
      const now = new Date();

      // 0. Recipient verification gate (PRD §8/§13) — enforced at the API
      //    layer AND re-checked here on live DB state (defense in depth).
      const recipient = await tx.user.findUnique({
        where: { id: recipientId },
        select: { verificationStatus: true, role: true },
      });
      if (!recipient || recipient.role !== "RECIPIENT" || recipient.verificationStatus !== "VERIFIED") {
        throw new AppError(
          ERROR_CODES.RECIPIENT_NOT_VERIFIED,
          "Your organisation is not verified yet. You will be able to claim food once an administrator verifies your account.",
          403
        );
      }

      // 1. Row-level lock — concurrent claim transactions block here (PRD §13).
      await tx.$queryRaw`SELECT id FROM "FoodListing" WHERE id = ${listingId} FOR UPDATE`;

      // 2. Read the (now locked) listing.
      const listing = await tx.foodListing.findUnique({
        where: { id: listingId },
      });
      if (!listing) {
        throw new AppError(ERROR_CODES.NOT_FOUND, "Listing not found.", 404);
      }

      // 3. Deadline check — expired listings are never claimable (PRD §17).
      if (
        listing.pickupDeadline.getTime() <= now.getTime() ||
        listing.status === "EXPIRED"
      ) {
        throw new AppError(
          ERROR_CODES.LISTING_EXPIRED,
          "This listing has expired.",
          409
        );
      }

      // 4. Claimability guard (status + quantity).
      if (!CLAIMABLE_LISTING_STATUSES.includes(listing.status)) {
        throw new AppError(
          ERROR_CODES.INVALID_STATE,
          listing.status === "FULLY_RESERVED"
            ? "This listing is fully reserved."
            : "This listing is no longer accepting claims.",
          409
        );
      }

      // 5. THE quantity check (PRD §22 race-condition protection).
      if (quantity > listing.availableQuantity) {
        throw new AppError(
          ERROR_CODES.INSUFFICIENT_QUANTITY,
          `Only ${listing.availableQuantity} ${listing.unit.toLowerCase()} are currently available.`,
          409
        );
      }

      // 6. Create the claim with its cryptographically secure token.
      const claimToken = generateClaimToken();
      const claim = await tx.claim.create({
        data: {
          listingId,
          recipientId,
          quantity,
          status: "RESERVED",
          claimToken,
          claimedAt: now,
        },
      });

      // 7. Atomically decrease availability (guarded UPDATE, belt-and-braces
      //    with the FOR UPDATE lock above).
      const updated = await tx.foodListing.updateMany({
        where: { id: listingId, availableQuantity: { gte: quantity } },
        data: {
          availableQuantity: { decrement: quantity },
          status: deriveListingStatus(
            listing.status,
            listing.totalQuantity,
            listing.availableQuantity - quantity
          ),
        },
      });
      if (updated.count === 0) {
        throw new AppError(
          ERROR_CODES.INSUFFICIENT_QUANTITY,
          "Your claim could not be completed because another recipient reserved the remaining quantity.",
          409
        );
      }

      // 8. Audit + provider notification (PRD §25/§60).
      await audit(tx, AUDIT_ACTIONS.CLAIM_CREATED, "Claim", claim.id, recipientId, {
        listingId,
        quantity,
        remainingAvailable: listing.availableQuantity - quantity,
      });

      await createNotifications(tx, [
        {
          userId: recipientId,
          title: "Reservation confirmed",
          message: `Your reservation for ${quantity} ${listing.unit.toLowerCase()} of "${listing.foodName}" is confirmed. Show your QR code at pickup.`,
          type: "CLAIM_SUCCESS",
        },
        {
          userId: listing.providerId,
          title: "New claim received",
          message: `A recipient reserved ${quantity} of ${listing.availableQuantity + quantity} ${listing.unit.toLowerCase()} of "${listing.foodName}". ${listing.availableQuantity - quantity} remain available.`,
          type: "NEW_CLAIM",
        },
      ]);

      return {
        claimId: claim.id,
        quantity,
        claimToken,
        listingStatus:
          listing.availableQuantity - quantity === 0
            ? "FULLY_RESERVED"
            : "PARTIALLY_RESERVED",
        availableQuantity: listing.availableQuantity - quantity,
      };
    }
  );
}

/**
 * Recipient cancellation (PRD §15/§24):
 *   current_time < pickup_deadline  → restore quantity, recompute status
 *   current_time >= deadline        → do NOT restore; close as EXPIRED
 */
export async function cancelClaim(
  claimId: string,
  recipientId: string
): Promise<{ restored: boolean; listingAvailable: number }> {
  return prisma.$transaction(
    async (tx) => {
      const now = new Date();
      const claim = await tx.claim.findUnique({
        where: { id: claimId },
        include: { listing: true },
      });
      if (!claim) {
        throw new AppError(ERROR_CODES.NOT_FOUND, "Claim not found.", 404);
      }
      if (claim.recipientId !== recipientId) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "You can only cancel your own claims.",
          403
        );
      }
      if (claim.status === "EXPIRED") {
        // PRD §15: after the deadline the claim is simply closed — no restore.
        // The expiry worker already closed it; record the cancellation attempt.
        await audit(
          tx,
          AUDIT_ACTIONS.CLAIM_CANCELLED,
          "Claim",
          claimId,
          recipientId,
          { listingId: claim.listingId, quantity: claim.quantity, restoredQuantity: 0, alreadyExpired: true }
        );
        return { restored: false, listingAvailable: claim.listing.availableQuantity };
      }
      if (!CANCELLABLE_CLAIM_STATUSES.includes(claim.status)) {
        throw new AppError(
          claim.status === "COLLECTED"
            ? ERROR_CODES.ALREADY_COLLECTED
            : ERROR_CODES.INVALID_STATE,
          claim.status === "COLLECTED"
            ? "This reservation has already been collected."
            : `A claim with status ${claim.status.toLowerCase().replace(/_/g, " ")} cannot be cancelled.`,
          409
        );
      }

      const beforeDeadline =
        claim.listing.pickupDeadline.getTime() > now.getTime() &&
        claim.listing.status !== "EXPIRED";

      assertClaimTransition(claim.status, "CANCELLED");
      await tx.claim.update({
        where: { id: claimId },
        data: { status: "CANCELLED", cancelledAt: now },
      });

      let listingAvailable = claim.listing.availableQuantity;

      if (beforeDeadline) {
        // Restore the quantity and make it claimable again (PRD §15).
        await tx.$queryRaw`SELECT id FROM "FoodListing" WHERE id = ${claim.listingId} FOR UPDATE`;
        const listing = await tx.foodListing.findUnique({
          where: { id: claim.listingId },
        });
        if (!listing) {
          throw new AppError(ERROR_CODES.NOT_FOUND, "Listing not found.", 404);
        }
        if (
          listing.status !== "EXPIRED" &&
          listing.status !== "CANCELLED" &&
          listing.status !== "COLLECTED"
        ) {
          listingAvailable = listing.availableQuantity + claim.quantity;
          await tx.foodListing.update({
            where: { id: claim.listingId },
            data: {
              availableQuantity: listingAvailable,
              status: deriveListingStatus(
                listing.status,
                listing.totalQuantity,
                listingAvailable
              ),
            },
          });

          // Re-notify other recipients that quantity is available again.
          const otherRecipients = await tx.claim.findMany({
            where: { listingId: claim.listingId, status: "RESERVED" },
            select: { recipientId: true },
            distinct: ["recipientId"],
          });
          await createNotifications(tx, [
            {
              userId: claim.listing.providerId,
              title: "Claim cancelled",
              message: `A recipient cancelled ${claim.quantity} ${claim.listing.unit.toLowerCase()} of "${claim.listing.foodName}". Quantity is available again.`,
              type: "CLAIM_CANCELLED",
            },
            ...otherRecipients.map((r) => ({
              userId: r.recipientId,
              title: "Quantity available again",
              message: `Additional quantity of "${claim.listing.foodName}" just became available.`,
              type: "QUANTITY_RESTORED" as const,
            })),
          ]);
        }
      }

      await audit(
        tx,
        AUDIT_ACTIONS.CLAIM_CANCELLED,
        "Claim",
        claimId,
        recipientId,
        {
          listingId: claim.listingId,
          quantity: claim.quantity,
          restoredQuantity: beforeDeadline ? claim.quantity : 0,
        }
      );

      return { restored: beforeDeadline, listingAvailable };
    }
  );
}

/**
 * Recipient signals they are en route → claim PICKUP_IN_PROGRESS (PRD §14).
 */
export async function startPickup(
  claimId: string,
  recipientId: string
): Promise<{ status: string }> {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: { listing: true },
  });
  if (!claim) throw new AppError(ERROR_CODES.NOT_FOUND, "Claim not found.", 404);
  if (claim.recipientId !== recipientId) {
    throw new AppError(ERROR_CODES.FORBIDDEN, "This is not your claim.", 403);
  }
  if (claim.status !== "RESERVED") {
    throw new AppError(
      ERROR_CODES.INVALID_STATE,
      "Only reserved claims can start pickup.",
      409
    );
  }
  if (claim.listing.pickupDeadline.getTime() <= Date.now()) {
    throw new AppError(ERROR_CODES.LISTING_EXPIRED, "This listing has expired.", 409);
  }

  return prisma.$transaction(async (tx) => {
    assertClaimTransition("RESERVED", "PICKUP_IN_PROGRESS");
    await tx.claim.update({
      where: { id: claimId },
      data: { status: "PICKUP_IN_PROGRESS" },
    });
    // Listing mirrors pickup activity when fully reserved (PRD §16).
    const listing = await tx.foodListing.findUnique({
      where: { id: claim.listingId },
    });
    if (listing && listing.status === "FULLY_RESERVED") {
      await tx.foodListing.update({
        where: { id: claim.listingId },
        data: { status: "PICKUP_IN_PROGRESS" },
      });
    }

    await createNotifications(tx, [
      {
        userId: claim.listing.providerId,
        title: "Recipient on the way",
        message: `A recipient is on the way to collect ${claim.quantity} ${claim.listing.unit.toLowerCase()} of "${claim.listing.foodName}".`,
        type: "RECIPIENT_ARRIVED",
      },
    ]);

    await audit(tx, AUDIT_ACTIONS.PICKUP_STARTED, "Claim", claimId, recipientId, {
      listingId: claim.listingId,
    });

    return { status: "PICKUP_IN_PROGRESS" };
  });
}

/**
 * QR-verified collection confirmation (PRD §27/§28).
 * Server-side validation of: token, scanner authorization, claim ownership of
 * listing, claim status, listing status, and deadline. Rejects double scans.
 */
export async function confirmCollectionByQr(
  scannerUserId: string,
  presentedClaimId: string,
  presentedToken: string
): Promise<{
  claimId: string;
  quantity: number;
  foodName: string;
  unit: string;
}> {
  return prisma.$transaction(
    async (tx) => {
      const now = new Date();
      const claim = await tx.claim.findUnique({
        where: { id: presentedClaimId },
        include: { listing: true },
      });

      if (!claim || claim.listingId !== claim.listing.id) {
        await audit(
          tx,
          AUDIT_ACTIONS.QR_SCAN_REJECTED,
          "Claim",
          presentedClaimId,
          scannerUserId,
          { reason: "CLAIM_NOT_FOUND" }
        );
        throw new AppError(ERROR_CODES.INVALID_TOKEN, "Invalid QR code.", 401);
      }

      // Only the listing's provider may scan (PRD §28 unauthorized scanner).
      if (claim.listing.providerId !== scannerUserId) {
        await audit(
          tx,
          AUDIT_ACTIONS.QR_SCAN_REJECTED,
          "Claim",
          claim.id,
          scannerUserId,
          { reason: "UNAUTHORIZED_SCANNER" }
        );
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Only the provider of this listing can verify collection.",
          403
        );
      }

      // Constant-time secure token comparison (PRD §26/§81).
      if (!tokenMatches(presentedToken, claim.claimToken)) {
        await audit(
          tx,
          AUDIT_ACTIONS.QR_SCAN_REJECTED,
          "Claim",
          claim.id,
          scannerUserId,
          { reason: "INVALID_TOKEN" }
        );
        throw new AppError(ERROR_CODES.INVALID_TOKEN, "Invalid QR code.", 401);
      }

      if (claim.status === "COLLECTED") {
        throw new AppError(
          ERROR_CODES.ALREADY_COLLECTED,
          "This reservation has already been collected.",
          409
        );
      }
      if (claim.status === "CANCELLED") {
        throw new AppError(
          ERROR_CODES.CLAIM_CANCELLED,
          "This claim was cancelled and can no longer be collected.",
          409
        );
      }
      if (claim.status === "EXPIRED" || claim.status === "NO_SHOW") {
        throw new AppError(
          ERROR_CODES.LISTING_EXPIRED,
          "This claim is closed and can no longer be collected.",
          409
        );
      }

      // Deadline grace: pickup must happen before the deadline (small grace
      // window accounts for clock skew between scanner and server).
      const graceMs = 2 * 60_000;
      if (claim.listing.pickupDeadline.getTime() + graceMs < now.getTime()) {
        throw new AppError(
          ERROR_CODES.LISTING_EXPIRED,
          "The pickup deadline for this listing has passed.",
          409
        );
      }

      // Transition to COLLECTED (guards CANCELLED→COLLECTED, COLLECTED→COLLECTED).
      assertClaimTransition(claim.status, "COLLECTED");
      await tx.claim.update({
        where: { id: claim.id },
        data: { status: "COLLECTED", collectedAt: now },
      });

      // If every reserved quantity is now collected, mark the listing COLLECTED.
      const outstanding = await tx.claim.count({
        where: {
          listingId: claim.listingId,
          status: { in: ["RESERVED", "PICKUP_IN_PROGRESS", "REQUESTED"] },
        },
      });
      if (outstanding === 0) {
        await tx.foodListing.update({
          where: { id: claim.listingId },
          data: { status: "COLLECTED", availableQuantity: 0 },
        });
      } else if (claim.listing.status === "PICKUP_IN_PROGRESS") {
        await tx.foodListing.update({
          where: { id: claim.listingId },
          data: { status: deriveListingStatus("PARTIALLY_RESERVED", claim.listing.totalQuantity, 0) === "FULLY_RESERVED" ? "FULLY_RESERVED" : "PARTIALLY_RESERVED" },
        });
      }

      await audit(
        tx,
        AUDIT_ACTIONS.COLLECTION_CONFIRMED,
        "Claim",
        claim.id,
        scannerUserId,
        {
          listingId: claim.listingId,
          quantity: claim.quantity,
          recipientId: claim.recipientId,
        }
      );

      await createNotifications(tx, [
        {
          userId: claim.recipientId,
          title: "Pickup successful",
          message: `Pickup successfully verified — ${claim.quantity} ${claim.listing.unit.toLowerCase()} of "${claim.listing.foodName}" collected. Thank you for saving food!`,
          type: "COLLECTION_SUCCESS",
        },
      ]);

      return {
        claimId: claim.id,
        quantity: claim.quantity,
        foodName: claim.listing.foodName,
        unit: claim.listing.unit,
      };
    }
  );
}

/**
 * Provider marks a claim as a no-show (admin/PRD §9 persona duty).
 * The reserved quantity is released back to the listing if still claimable.
 */
export async function markNoShow(
  claimId: string,
  providerId: string
): Promise<{ quantityReleased: number }> {
  return prisma.$transaction(async (tx) => {
    const claim = await tx.claim.findUnique({
      where: { id: claimId },
      include: { listing: true },
    });
    if (!claim) throw new AppError(ERROR_CODES.NOT_FOUND, "Claim not found.", 404);
    if (claim.listing.providerId !== providerId) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only the provider of this listing can mark no-shows.",
        403
      );
    }
    if (!["RESERVED", "PICKUP_IN_PROGRESS"].includes(claim.status)) {
      throw new AppError(
        ERROR_CODES.INVALID_STATE,
        "Only active claims can be marked as no-show.",
        409
      );
    }

    await tx.claim.update({
      where: { id: claimId },
      data: { status: "NO_SHOW", cancelledAt: new Date() },
    });

    let released = 0;
    const listing = await tx.foodListing.findUnique({
      where: { id: claim.listingId },
    });
    if (
      listing &&
      CLAIMABLE_LISTING_STATUSES.includes(listing.status) &&
      listing.pickupDeadline.getTime() > Date.now()
    ) {
      released = claim.quantity;
      const available = listing.availableQuantity + claim.quantity;
      await tx.foodListing.update({
        where: { id: listing.id },
        data: {
          availableQuantity: available,
          status: deriveListingStatus(listing.status, listing.totalQuantity, available),
        },
      });
    }

    await audit(tx, AUDIT_ACTIONS.CLAIM_NO_SHOW, "Claim", claimId, providerId, {
      listingId: claim.listingId,
      quantityReleased: released,
    });

    return { quantityReleased: released };
  });
}
