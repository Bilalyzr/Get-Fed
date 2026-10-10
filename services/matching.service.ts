import { prisma } from "@/lib/prisma";
import { createNotifications } from "@/lib/notifications";
import {
  scoreCandidate,
  rankCandidates,
  type MatchCandidate,
} from "@/lib/matching";
import type { FullListing } from "@/services/listing.service";

// ---------------------------------------------------------------------------
// Matching orchestration (PRD §22/§33):
//   new listing → find verified recipients → filter eligibility →
//   score → sort desc → notify best recipients.
// ---------------------------------------------------------------------------

export async function computeMatchesForListing(
  listing: FullListing,
  limit = 20
): Promise<
  Array<{
    recipientId: string;
    recipientName: string;
    organisationName: string;
    distanceKm: number;
    etaMinutes: number;
    matchScore: number;
    subscores: MatchCandidate["subscores"];
  }>
> {
  const recipients = await prisma.user.findMany({
    where: {
      role: "RECIPIENT",
      verificationStatus: "VERIFIED",
      latitude: { not: null },
      longitude: { not: null },
    },
    include: { preference: true },
  });

  const now = new Date();
  const history = await prisma.claim.groupBy({
    by: ["recipientId", "status"],
    where: { recipientId: { in: recipients.map((r) => r.id) } },
    _count: { _all: true },
  });

  const statsByRecipient = new Map<string, { successful: number; total: number }>();
  for (const row of history) {
    const entry = statsByRecipient.get(row.recipientId) ?? { successful: 0, total: 0 };
    if (row.status === "COLLECTED") entry.successful += row._count._all;
    if (["COLLECTED", "NO_SHOW", "EXPIRED"].includes(row.status)) {
      entry.total += row._count._all;
    }
    statsByRecipient.set(row.recipientId, entry);
  }

  const scored = rankCandidates(
    recipients.map((recipient) =>
      scoreCandidate(
        recipient,
        {
          latitude: listing.latitude,
          longitude: listing.longitude,
          availableQuantity: listing.availableQuantity,
          pickupDeadline: listing.pickupDeadline,
        },
        statsByRecipient.get(recipient.id) ?? { successful: 0, total: 0 },
        now
      )
    )
  );

  return scored.slice(0, limit).map((c) => ({
    recipientId: c.recipient.id,
    recipientName: c.recipient.name,
    organisationName: c.recipient.organisationName,
    distanceKm: Math.round(c.distanceKm * 10) / 10,
    etaMinutes: c.etaMinutes,
    matchScore: c.score,
    subscores: c.subscores,
  }));
}

/**
 * Notify the best-matched recipients about a newly published listing
 * (PRD §22 step 9). Only verified, reachable recipients are notified.
 */
export async function notifyMatchesForListing(listing: FullListing): Promise<number> {
  const matches = await computeMatchesForListing(listing, 10);
  if (matches.length === 0) return 0;

  const deadline = listing.pickupDeadline.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  await createNotifications(
    prisma,
    matches.map((m) => ({
      userId: m.recipientId,
      title: "New food nearby",
      message: `${listing.foodName}: ${listing.availableQuantity} ${listing.unit.toLowerCase()} available ${m.distanceKm} km away. Pickup before ${deadline}.`,
      type: "NEW_LISTING_NEARBY" as const,
    }))
  );

  return matches.length;
}
