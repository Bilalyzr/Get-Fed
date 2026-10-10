import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Analytics engine (PRD §29/§30/§38–§41).
// North-Star Metric: SUCCESSFULLY COLLECTED SURPLUS QUANTITY — never listing
// count. All ratios are division-by-zero safe (PRD §30).
// ---------------------------------------------------------------------------

function safeRatio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10; // %, 1 decimal
}

export type ProviderAnalytics = {
  activeListings: number;
  mealsAvailable: number;
  mealsClaimed: number;
  successfulCollections: number;
  expiredQuantity: number;
  cancelledClaims: number;
  collectionSuccessRate: number;
  claimConversionRate: number;
  mealsRecoveredTrend: { date: string; meals: number }[];
  categoryBreakdown: { category: string; quantity: number }[];
};

export async function getProviderAnalytics(providerId: string): Promise<ProviderAnalytics> {
  const [
    listings,
    activeListings,
    collectedClaims,
    expiredListings,
    cancelledClaims,
    recentCollected,
    categoryAgg,
  ] = await Promise.all([
    prisma.foodListing.findMany({
      where: { providerId },
      select: {
        id: true,
        totalQuantity: true,
        availableQuantity: true,
        status: true,
        category: true,
        createdAt: true,
        claims: { select: { id: true } },
      },
    }),
    prisma.foodListing.count({
      where: {
        providerId,
        status: { in: ["AVAILABLE", "PARTIALLY_RESERVED", "FULLY_RESERVED", "PICKUP_IN_PROGRESS"] },
      },
    }),
    prisma.claim.findMany({
      where: { listing: { providerId }, status: "COLLECTED" },
      select: { quantity: true, collectedAt: true },
    }),
    prisma.foodListing.findMany({
      where: { providerId, status: "EXPIRED" },
      select: { totalQuantity: true, availableQuantity: true },
    }),
    prisma.claim.count({ where: { listing: { providerId }, status: "CANCELLED" } }),
    prisma.claim.findMany({
      where: {
        listing: { providerId },
        status: "COLLECTED",
        collectedAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      },
      select: { quantity: true, collectedAt: true },
    }),
    prisma.foodListing.groupBy({
      by: ["category"],
      where: { providerId },
      _sum: { totalQuantity: true },
    }),
  ]);

  const mealsRecovered = collectedClaims.reduce((sum, c) => sum + c.quantity, 0);
  const mealsClaimedTotal = await prisma.claim.aggregate({
    where: { listing: { providerId }, status: { in: ["RESERVED", "PICKUP_IN_PROGRESS", "COLLECTED"] } },
    _sum: { quantity: true },
  });
  const listingsWithClaims = listings.filter((l) => l.claims.length > 0).length;

  // 14-day recovery trend.
  const trendMap = new Map<string, number>();
  for (let i = 13; i >= 0; i -= 1) {
    const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    trendMap.set(day.toISOString().slice(0, 10), 0);
  }
  for (const claim of recentCollected) {
    if (claim.collectedAt) {
      const key = claim.collectedAt.toISOString().slice(0, 10);
      if (trendMap.has(key)) trendMap.set(key, (trendMap.get(key) ?? 0) + claim.quantity);
    }
  }

  return {
    activeListings,
    mealsAvailable: activeListings
      ? (
          await prisma.foodListing.aggregate({
            where: {
              providerId,
              status: { in: ["AVAILABLE", "PARTIALLY_RESERVED"] },
            },
            _sum: { availableQuantity: true },
          })
        )._sum.availableQuantity ?? 0
      : 0,
    mealsClaimed: mealsClaimedTotal._sum.quantity ?? 0,
    successfulCollections: collectedClaims.length,
    // Wasted quantity for an expired listing is whatever was never collected —
    // for expired rows availableQuantity is zeroed by the expiry worker, so
    // derive it as total minus collected claims.
    expiredQuantity: await prisma.claim
      .aggregate({
        where: { listing: { providerId, status: "EXPIRED" }, status: "COLLECTED" },
        _sum: { quantity: true },
      })
      .then((agg) =>
        expiredListings.reduce((sum, l) => sum + l.totalQuantity, 0) -
        (agg._sum.quantity ?? 0)
      ),
    cancelledClaims,
    collectionSuccessRate: safeRatio(collectedClaims.length, collectedClaims.length + cancelledClaims),
    claimConversionRate: safeRatio(listingsWithClaims, listings.length),
    mealsRecoveredTrend: Array.from(trendMap.entries()).map(([date, meals]) => ({
      date: date.slice(5),
      meals,
    })),
    categoryBreakdown: categoryAgg
      .map((c) => ({ category: c.category, quantity: c._sum.totalQuantity ?? 0 }))
      .sort((a, b) => b.quantity - a.quantity),
  };
}

export type RecipientAnalytics = {
  activeClaims: number;
  pastCollections: number;
  mealsCollected: number;
  cancelledClaims: number;
  reliabilityPercent: number;
  collectionHistory: { date: string; meals: number }[];
};

export async function getRecipientAnalytics(recipientId: string): Promise<RecipientAnalytics> {
  const [active, collected, cancelled, recent] = await Promise.all([
    prisma.claim.count({
      where: { recipientId, status: { in: ["RESERVED", "PICKUP_IN_PROGRESS", "REQUESTED"] } },
    }),
    prisma.claim.findMany({
      where: { recipientId, status: "COLLECTED" },
      select: { quantity: true, collectedAt: true },
    }),
    prisma.claim.count({ where: { recipientId, status: "CANCELLED" } }),
    prisma.claim.findMany({
      where: {
        recipientId,
        status: "COLLECTED",
        collectedAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      },
      select: { quantity: true, collectedAt: true },
    }),
  ]);

  const reservedTotals = await prisma.claim.count({
    where: { recipientId, status: { in: ["COLLECTED", "NO_SHOW", "EXPIRED"] } },
  });

  const trendMap = new Map<string, number>();
  for (let i = 13; i >= 0; i -= 1) {
    const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    trendMap.set(day.toISOString().slice(0, 10), 0);
  }
  for (const claim of recent) {
    if (claim.collectedAt) {
      const key = claim.collectedAt.toISOString().slice(0, 10);
      if (trendMap.has(key)) trendMap.set(key, (trendMap.get(key) ?? 0) + claim.quantity);
    }
  }

  return {
    activeClaims: active,
    pastCollections: collected.length,
    mealsCollected: collected.reduce((s, c) => s + c.quantity, 0),
    cancelledClaims: cancelled,
    reliabilityPercent: safeRatio(collected.length, collected.length + reservedTotals),
    collectionHistory: Array.from(trendMap.entries()).map(([date, meals]) => ({
      date: date.slice(5),
      meals,
    })),
  };
}

export type AdminAnalytics = {
  activeProviders: number;
  verifiedRecipients: number;
  pendingRecipients: number;
  totalUsers: number;
  activeListings: number;
  expiredListings: number;
  totalListings: number;
  mealsRecovered: number;
  expiredQuantity: number;
  publishedQuantity: number;
  cancelledClaims: number;
  noShowClaims: number;
  collectionRate: number;
  noShowRate: number;
  claimConversionRate: number;
  expiryRate: number;
  averageTimeToFirstClaimMinutes: number | null;
  mealsRecoveredTrend: { date: string; meals: number }[];
  statusBreakdown: { status: string; count: number }[];
};

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    activeProviders,
    verifiedRecipients,
    pendingRecipients,
    totalUsers,
    activeListings,
    expiredListings,
    totalListings,
    collectedClaims,
    expiredQtyAgg,
    publishedQtyAgg,
    cancelledClaims,
    noShowClaims,
    reservedClaims,
    listingsWithClaim,
    firstClaims,
    recentCollected,
    statusAgg,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "PROVIDER" } }),
    prisma.user.count({ where: { role: "RECIPIENT", verificationStatus: "VERIFIED" } }),
    prisma.user.count({ where: { role: "RECIPIENT", verificationStatus: "PENDING" } }),
    prisma.user.count(),
    prisma.foodListing.count({
      where: { status: { in: ["AVAILABLE", "PARTIALLY_RESERVED", "FULLY_RESERVED", "PICKUP_IN_PROGRESS"] } },
    }),
    prisma.foodListing.count({ where: { status: "EXPIRED" } }),
    prisma.foodListing.count(),
    prisma.claim.findMany({ where: { status: "COLLECTED" }, select: { quantity: true, collectedAt: true } }),
    prisma.foodListing.aggregate({ where: { status: "EXPIRED" }, _sum: { availableQuantity: true } }),
    prisma.foodListing.aggregate({ where: { createdAt: { gte: thirtyDaysAgo } }, _sum: { totalQuantity: true } }),
    prisma.claim.count({ where: { status: "CANCELLED" } }),
    prisma.claim.count({ where: { status: "NO_SHOW" } }),
    prisma.claim.count({ where: { status: { in: ["RESERVED", "PICKUP_IN_PROGRESS", "COLLECTED"] } } }),
    prisma.foodListing.count({ where: { claims: { some: {} } } }),
    prisma.claim.findMany({
      where: { listing: { createdAt: { gte: thirtyDaysAgo } } },
      select: { createdAt: true, listingId: true, listing: { select: { createdAt: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.claim.findMany({
      where: { status: "COLLECTED", collectedAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
      select: { quantity: true, collectedAt: true },
    }),
    prisma.foodListing.groupBy({ by: ["status"], _count: { status: true } }),
  ]);

  // Average time-to-first-claim: first claim per listing within window.
  const firstClaimPerListing = new Map<string, number>();
  for (const claim of firstClaims) {
    const deltaMin =
      (claim.createdAt.getTime() - claim.listing.createdAt.getTime()) / 60_000;
    const prev = firstClaimPerListing.get(claim.listingId);
    if (prev === undefined || deltaMin < prev) {
      firstClaimPerListing.set(claim.listingId, deltaMin);
    }
  }
  const avgFirstClaim =
    firstClaimPerListing.size > 0
      ? Math.round(
          (Array.from(firstClaimPerListing.values()).reduce((a, b) => a + b, 0) /
            firstClaimPerListing.size) *
            10
        ) / 10
      : null;

  const trendMap = new Map<string, number>();
  for (let i = 13; i >= 0; i -= 1) {
    const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    trendMap.set(day.toISOString().slice(0, 10), 0);
  }
  for (const claim of recentCollected) {
    if (claim.collectedAt) {
      const key = claim.collectedAt.toISOString().slice(0, 10);
      if (trendMap.has(key)) trendMap.set(key, (trendMap.get(key) ?? 0) + claim.quantity);
    }
  }

  const confirmedClaims = collectedClaims.length + cancelledClaims + noShowClaims;

  return {
    activeProviders,
    verifiedRecipients,
    pendingRecipients,
    totalUsers,
    activeListings,
    expiredListings,
    totalListings,
    mealsRecovered: collectedClaims.reduce((s, c) => s + c.quantity, 0),
    expiredQuantity: expiredQtyAgg._sum.availableQuantity ?? 0,
    publishedQuantity: publishedQtyAgg._sum.totalQuantity ?? 0,
    cancelledClaims,
    noShowClaims,
    collectionRate: safeRatio(collectedClaims.length, confirmedClaims),
    noShowRate: safeRatio(noShowClaims, confirmedClaims),
    claimConversionRate: safeRatio(listingsWithClaim, totalListings),
    expiryRate: safeRatio(expiredQtyAgg._sum.availableQuantity ?? 0, publishedQtyAgg._sum.totalQuantity ?? 0),
    averageTimeToFirstClaimMinutes: avgFirstClaim,
    mealsRecoveredTrend: Array.from(trendMap.entries()).map(([date, meals]) => ({
      date: date.slice(5),
      meals,
    })),
    statusBreakdown: statusAgg
      .map((s) => ({ status: s.status, count: s._count.status }))
      .sort((a, b) => b.count - a.count),
  };
}
