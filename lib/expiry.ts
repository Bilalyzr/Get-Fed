import { prisma } from "@/lib/prisma";
import { audit, AUDIT_ACTIONS } from "@/lib/audit";
import { createNotifications } from "@/lib/notifications";

// ---------------------------------------------------------------------------
// Expiry engine (PRD §17/§25/§26).
// Finds listings whose pickup deadline has passed and marks them EXPIRED,
// zeroes availability, expires outstanding claims, notifies stakeholders.
// Invoked by the cron job (/api/cron/expiry) roughly every minute and also
// lazily before discovery reads.
// ---------------------------------------------------------------------------

export type ExpiryResult = {
  processed: number;
  listings: { id: string; foodName: string }[];
};

const EXPIRABLE_STATUSES = [
  "AVAILABLE",
  "PARTIALLY_RESERVED",
  "FULLY_RESERVED",
  "PICKUP_IN_PROGRESS",
] as const;

export async function expireOverdueListings(
  now = new Date()
): Promise<ExpiryResult> {
  const overdue = await prisma.foodListing.findMany({
    where: {
      pickupDeadline: { lte: now },
      status: { in: [...EXPIRABLE_STATUSES] },
    },
    include: { claims: true, provider: true },
  });

  const processedNames: { id: string; foodName: string }[] = [];

  for (const listing of overdue) {
    await prisma.$transaction(async (tx) => {
      await tx.foodListing.update({
        where: { id: listing.id },
        data: { status: "EXPIRED", availableQuantity: 0 },
      });

      const activeClaims = listing.claims.filter(
        (c) => c.status === "RESERVED" || c.status === "PICKUP_IN_PROGRESS" || c.status === "REQUESTED"
      );

      if (activeClaims.length > 0) {
        await tx.claim.updateMany({
          where: { id: { in: activeClaims.map((c) => c.id) } },
          data: { status: "EXPIRED", cancelledAt: now },
        });
      }

      await audit(
        tx,
        AUDIT_ACTIONS.LISTING_EXPIRED,
        "FoodListing",
        listing.id,
        listing.providerId,
        {
          foodName: listing.foodName,
          wastedQuantity: listing.availableQuantity,
          activeClaimsExpired: activeClaims.length,
        }
      );

      await createNotifications(tx, [
        {
          userId: listing.providerId,
          title: "Listing expired",
          message: `Your listing "${listing.foodName}" has passed its pickup deadline and is no longer claimable.`,
          type: "LISTING_EXPIRED",
        },
        ...activeClaims.map((claim) => ({
          userId: claim.recipientId,
          title: "Listing expired",
          message: `"${listing.foodName}" expired before pickup. Your reservation for ${claim.quantity} was closed.`,
          type: "LISTING_EXPIRED" as const,
        })),
      ]);
    });

    processedNames.push({ id: listing.id, foodName: listing.foodName });
  }

  return { processed: overdue.length, listings: processedNames };
}

// ---------------------------------------------------------------------------
// Pickup reminders (PRD §25 #4): notify recipients with a RESERVED claim
// whose listing deadline falls within the next 30 minutes, at most once
// (reminderSentAt guard).
// ---------------------------------------------------------------------------

export async function sendPickupReminders(
  now = new Date()
): Promise<{ sent: number }> {
  const windowEnd = new Date(now.getTime() + 30 * 60_000);

  const upcoming = await prisma.claim.findMany({
    where: {
      status: "RESERVED",
      listing: {
        pickupDeadline: { gt: now, lte: windowEnd },
      },
    },
    include: { listing: true },
  });

  let sent = 0;
  for (const claim of upcoming) {
    const minutesLeft = Math.max(
      1,
      Math.round(
        (claim.listing.pickupDeadline.getTime() - now.getTime()) / 60_000
      )
    );
    await createNotifications(prisma, [
      {
        userId: claim.recipientId,
        title: "Pickup reminder",
        message: `Pickup deadline in ~${minutesLeft} minutes for "${claim.listing.foodName}" (${claim.quantity} ${claim.listing.unit.toLowerCase()}). Please head to ${claim.listing.pickupAddress}.`,
        type: "PICKUP_REMINDER",
      },
    ]);
    sent += 1;
  }

  return { sent };
}
