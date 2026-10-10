import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Dashboard aggregation (PRD §41/§42/§43): real DB numbers only — never
// hardcoded production metrics (PRD §41).
// ---------------------------------------------------------------------------

export async function getProviderDashboard(providerId: string) {
  const now = new Date();
  const [listings, recentClaims, recentNotifications] = await Promise.all([
    prisma.foodListing.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { claims: { orderBy: { createdAt: "desc" }, take: 10, include: { recipient: { select: { organisationName: true, name: true } } } } },
    }),
    prisma.claim.findMany({
      where: { listing: { providerId } },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { listing: { select: { foodName: true, unit: true, pickupDeadline: true } }, recipient: { select: { organisationName: true } } },
    }),
    prisma.notification.findMany({
      where: { userId: providerId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const active = listings.filter((l) =>
    ["AVAILABLE", "PARTIALLY_RESERVED", "FULLY_RESERVED", "PICKUP_IN_PROGRESS"].includes(l.status)
  );
  const collectedClaims = listings.flatMap((l) => l.claims).filter((c) => c.status === "COLLECTED");

  return {
    metrics: {
      activeListings: active.length,
      mealsAvailable: active.reduce((s, l) => s + l.availableQuantity, 0),
      mealsClaimed: listings
        .flatMap((l) => l.claims)
        .filter((c) => ["RESERVED", "PICKUP_IN_PROGRESS", "COLLECTED"].includes(c.status))
        .reduce((s, c) => s + c.quantity, 0),
      successfulCollections: collectedClaims.length,
      mealsRecovered: collectedClaims.reduce((s, c) => s + c.quantity, 0),
      expiredListings: listings.filter((l) => l.status === "EXPIRED").length,
    },
    activeListings: active.slice(0, 6).map((l) => ({
      id: l.id,
      foodName: l.foodName,
      status: l.status,
      totalQuantity: l.totalQuantity,
      availableQuantity: l.availableQuantity,
      unit: l.unit,
      pickupDeadline: l.pickupDeadline.toISOString(),
      claimCount: l.claims.length,
    })),
    recentClaims: recentClaims.map((c) => ({
      id: c.id,
      quantity: c.quantity,
      status: c.status,
      foodName: c.listing.foodName,
      recipientOrg: c.recipient.organisationName,
      createdAt: c.createdAt.toISOString(),
      pickupDeadline: c.listing.pickupDeadline.toISOString(),
      expired: c.listing.pickupDeadline.getTime() <= now.getTime(),
    })),
    notifications: recentNotifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}

export async function getRecipientDashboard(recipientId: string) {
  const now = new Date();
  const [claims, upcomingDeadlines, recentCollections, notifications] =
    await Promise.all([
      prisma.claim.findMany({
        where: { recipientId },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { listing: { select: { foodName: true, unit: true, pickupDeadline: true, status: true, latitude: true, longitude: true, pickupAddress: true } } },
      }),
      prisma.claim.count({
        where: {
          recipientId,
          status: { in: ["RESERVED", "PICKUP_IN_PROGRESS"] },
          listing: { pickupDeadline: { gt: now } },
        },
      }),
      prisma.claim.findMany({
        where: { recipientId, status: "COLLECTED" },
        orderBy: { collectedAt: "desc" },
        take: 10,
        include: { listing: { select: { foodName: true, unit: true } } },
      }),
      prisma.notification.findMany({
        where: { userId: recipientId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  const activeClaims = claims.filter(
    (c) =>
      ["RESERVED", "PICKUP_IN_PROGRESS"].includes(c.status) &&
      c.listing.pickupDeadline.getTime() > now.getTime()
  );
  const collected = claims.filter((c) => c.status === "COLLECTED");

  return {
    metrics: {
      activeClaims: activeClaims.length,
      upcomingDeadlines,
      mealsCollected: collected.reduce((s, c) => s + c.quantity, 0),
      pastCollections: collected.length,
    },
    activeClaims: activeClaims.slice(0, 6).map((c) => ({
      id: c.id,
      quantity: c.quantity,
      status: c.status,
      foodName: c.listing.foodName,
      unit: c.listing.unit,
      pickupDeadline: c.listing.pickupDeadline.toISOString(),
      pickupAddress: c.listing.pickupAddress,
      latitude: c.listing.latitude,
      longitude: c.listing.longitude,
    })),
    pastCollections: recentCollections.map((c) => ({
      id: c.id,
      quantity: c.quantity,
      foodName: c.listing.foodName,
      unit: c.listing.unit,
      collectedAt: (c.collectedAt ?? c.createdAt).toISOString(),
    })),
    notifications: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}

export async function getAdminDashboard() {
  const [users, listings, claims, auditLogs] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, name: true, email: true, role: true, organisationName: true, verificationStatus: true, createdAt: true },
    }),
    prisma.foodListing.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { provider: { select: { organisationName: true } }, _count: { select: { claims: true } } },
    }),
    prisma.claim.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        listing: { select: { foodName: true } },
        recipient: { select: { organisationName: true } },
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { user: { select: { name: true, organisationName: true, role: true } } },
    }),
  ]);

  return {
    users,
    listings,
    claims,
    // Normalize so client pages can always read actor.name — system
    // generated events (userId null / user deleted) fall back to "System".
    auditLogs: auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      createdAt: log.createdAt.toISOString(),
      actor: log.user
        ? {
            name: log.user.name,
            organisation: log.user.organisationName,
            role: log.user.role,
          }
        : { name: "System", organisation: "Food Worth Saving", role: "SYSTEM" },
    })),
  };
}
