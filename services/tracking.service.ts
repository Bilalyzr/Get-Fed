import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { createNotifications } from "@/lib/notifications";
import { AppError, ERROR_CODES } from "@/lib/api";
import { distanceMeters, calculateRoute } from "@/lib/tracking/routing-service";
import { TRACKING_CONFIG } from "@/lib/tracking/config";
import { Prisma } from "@prisma/client";
import type { Claim, FoodListing, PickupTrackingSession } from "@prisma/client";

// ---------------------------------------------------------------------------
// Live pickup tracking service (spec §4–§10).
//
// Security model: identity always comes from the server session at the API
// layer; this service re-verifies claim ownership, claim eligibility and
// listing deadline on every operation. Only the LATEST location is persisted
// (no GPS history) and coordinates are cleared when tracking stops.
// ---------------------------------------------------------------------------

const TRACKABLE_CLAIM_STATUSES = ["RESERVED", "PICKUP_IN_PROGRESS"] as const;

export type ClaimWithListing = Claim & { listing: FoodListing };

export async function loadClaimWithListing(claimId: string): Promise<ClaimWithListing> {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: { listing: true },
  });
  if (!claim) {
    throw new AppError(ERROR_CODES.NOT_FOUND, "Claim not found.", 404);
  }
  return claim as ClaimWithListing;
}

export function isClaimTrackable(claim: ClaimWithListing, now = new Date()): boolean {
  return (
    TRACKABLE_CLAIM_STATUSES.includes(claim.status as (typeof TRACKABLE_CLAIM_STATUSES)[number]) &&
    claim.listing.status !== "EXPIRED" &&
    claim.listing.status !== "CANCELLED" &&
    claim.listing.pickupDeadline.getTime() > now.getTime()
  );
}

// ---------------------------------------------------------------------------
// Start / resume
// ---------------------------------------------------------------------------

export async function startTracking(claimId: string, recipientId: string) {
  const claim = await loadClaimWithListing(claimId);
  if (claim.recipientId !== recipientId) {
    throw new AppError(ERROR_CODES.FORBIDDEN, "This is not your claim.", 403);
  }
  if (!isClaimTrackable(claim)) {
    throw new AppError(
      ERROR_CODES.INVALID_STATE,
      "This claim is not eligible for live tracking right now.",
      409
    );
  }

  const session = await prisma.pickupTrackingSession.upsert({
    where: { claimId },
    update: {}, // existing terminal/stopped session validated below
    create: { claimId, status: "ACTIVE", startedAt: new Date() },
  });

  // Resume only after revalidating eligibility (spec §5) — sessions that ended
  // in a terminal state for a still-eligible claim may restart fresh.
  if (["STOPPED", "CANCELLED"].includes(session.status) || session.status === "COMPLETED") {
    const fresh = await prisma.pickupTrackingSession.update({
      where: { claimId },
      data: {
        status: "ACTIVE",
        startedAt: new Date(),
        stoppedAt: null,
        // consent restart wipes prior coordinates and alert stamps
        lastLatitude: null,
        lastLongitude: null,
        accuracyMeters: null,
        headingDegrees: null,
        speedMps: null,
        lastLocationAt: null,
        clientTimestamp: null,
        routeAvailable: false,
        routeDistanceMeters: null,
        routeDurationSeconds: null,
        routeGeometry: Prisma.JsonNull,
        consecutiveArrivalFixes: 0,
        arrivalDetectedAt: null,
        arrivalAlertSentAt: null,
        delayAlertSentAt: null,
        staleAlertSentAt: null,
      },
    });
    await audit(prisma, "TRACKING_RESUMED", "PickupTrackingSession", fresh.id, recipientId, { claimId });
    await notifyProvider(claim, "Live tracking resumed", `The recipient resumed live tracking for "${claim.listing.foodName}".`, "TRACKING_STARTED");
    return fresh;
  }

  if (session.status === "ARRIVED") {
    return session; // already at the pickup point — keep the arrived state
  }

  await audit(prisma, "TRACKING_STARTED", "PickupTrackingSession", session.id, recipientId, { claimId });
  await notifyProvider(claim, "Live tracking started", `The recipient started sharing live location for "${claim.listing.foodName}".`, "TRACKING_STARTED");
  return session;
}

// ---------------------------------------------------------------------------
// Location ingestion — validation, persistence, routing, arrival, alerts
// ---------------------------------------------------------------------------

export type LocationInput = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  headingDegrees?: number | null;
  speedMps?: number | null;
  clientTimestamp: Date;
};

export async function submitLocation(
  claimId: string,
  recipientId: string,
  input: LocationInput
) {
  const claim = await loadClaimWithListing(claimId);
  if (claim.recipientId !== recipientId) {
    throw new AppError(ERROR_CODES.FORBIDDEN, "This is not your claim.", 403);
  }

  // Coordinate + accuracy validation (spec §6 / §15)
  if (
    !Number.isFinite(input.latitude) ||
    !Number.isFinite(input.longitude) ||
    input.latitude < -90 ||
    input.latitude > 90 ||
    input.longitude < -180 ||
    input.longitude > 180
  ) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid coordinates.", 422);
  }
  if (!Number.isFinite(input.accuracyMeters) || input.accuracyMeters < 0 || input.accuracyMeters > 5000) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Unreasonable GPS accuracy reported.", 422);
  }

  // Reject unreasonable/stale client timestamps (server time is authoritative)
  const now = new Date();
  const skewMs = now.getTime() - input.clientTimestamp.getTime();
  const maxSkew = TRACKING_CONFIG.maxClockSkewMinutes * 60_000;
  if (Math.abs(skewMs) > maxSkew) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Location timestamp is too far from server time.", 422);
  }

  const session = await prisma.pickupTrackingSession.findUnique({ where: { claimId } });
  if (!session) {
    throw new AppError(ERROR_CODES.NOT_FOUND, "No tracking session for this claim.", 404);
  }
  if (session.status !== "ACTIVE" && session.status !== "ARRIVED") {
    throw new AppError(ERROR_CODES.INVALID_STATE, "Tracking is not active for this claim.", 409);
  }
  if (!isClaimTrackable(claim, now)) {
    // claim became ineligible mid-journey → stop session, reject the fix
    await stopTrackingForClaim(claimId, "STOPPED", recipientId, "claim_became_ineligible");
    throw new AppError(ERROR_CODES.INVALID_STATE, "This claim is no longer eligible for tracking.", 409);
  }

  // ---- persist the latest fix ------------------------------------------
  await prisma.pickupTrackingSession.update({
    where: { claimId },
    data: {
      lastLatitude: input.latitude,
      lastLongitude: input.longitude,
      accuracyMeters: input.accuracyMeters,
      headingDegrees: input.headingDegrees ?? null,
      speedMps: input.speedMps ?? null,
      lastLocationAt: now,
      clientTimestamp: input.clientTimestamp,
    },
  });

  // ---- road route + ETA (throttled, fail-safe) --------------------------
  const route = await calculateRoute(
    `tracking:${claimId}`,
    { latitude: input.latitude, longitude: input.longitude },
    { latitude: claim.listing.latitude, longitude: claim.listing.longitude }
  );
  await prisma.pickupTrackingSession.update({
    where: { claimId },
    data: {
      routeAvailable: route.available,
      routeDistanceMeters: route.available ? route.distanceMeters : null,
      routeDurationSeconds: route.available ? route.durationSeconds : null,
      routeGeometry: route.available ? (route.geometry as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
  });

  // ---- arrival detection (spec §9) --------------------------------------
  await evaluateArrival(claim, {
    latitude: input.latitude,
    longitude: input.longitude,
  }, input.accuracyMeters, recipientId);

  // ---- delay + stale evaluation (spec §10) ------------------------------
  await evaluateDelay(claim, route, recipientId);
  await evaluateStale(claim, recipientId, now, false);

  return getTrackingState(claimId, recipientId, "RECIPIENT");
}

async function evaluateArrival(
  claim: ClaimWithListing,
  point: { latitude: number; longitude: number },
  accuracyMeters: number,
  actorId: string
) {
  const session = await prisma.pickupTrackingSession.findUnique({ where: { claimId: claim.id } });
  if (!session) return;

  const distance = distanceMeters(point, {
    latitude: claim.listing.latitude,
    longitude: claim.listing.longitude,
  });
  const qualifies =
    distance <= TRACKING_CONFIG.arrivalRadiusMeters &&
    accuracyMeters <= TRACKING_CONFIG.maxAccuracyMeters;

  let fixes = session.consecutiveArrivalFixes + (qualifies ? 1 : 0);
  if (!qualifies) fixes = 0;

  // Hysteresis: once ARRIVED, only a large move away re-arms tracking.
  const rearmDistance = TRACKING_CONFIG.arrivalRadiusMeters * TRACKING_CONFIG.arrivalHysteresisFactor;
  if (session.status === "ARRIVED" && distance > rearmDistance) {
    await prisma.pickupTrackingSession.update({
      where: { claimId: claim.id },
      data: { status: "ACTIVE", arrivalDetectedAt: null, consecutiveArrivalFixes: 0 },
    });
    return;
  }

  if (
    session.status !== "ARRIVED" &&
    fixes >= TRACKING_CONFIG.arrivalFixThreshold
  ) {
    const now = new Date();
    const updated = await prisma.pickupTrackingSession.update({
      where: { claimId: claim.id },
      data: { status: "ARRIVED", arrivalDetectedAt: now, consecutiveArrivalFixes: fixes },
    });
    await audit(prisma, "TRACKING_ARRIVED", "PickupTrackingSession", updated.id, actorId, {
      claimId: claim.id,
      distanceMeters: Math.round(distance),
      accuracyMeters,
    });

    // Deduplicated arrival alert (arrivalAlertSentAt guard)
    if (!updated.arrivalAlertSentAt) {
      await prisma.pickupTrackingSession.update({
        where: { claimId: claim.id },
        data: { arrivalAlertSentAt: now },
      });
      await notifyProvider(claim, "Recipient arrived", `The recipient has arrived to collect "${claim.listing.foodName}". Ready to scan their QR.`, "TRACKING_ARRIVED");
      await createNotifications(prisma, [
        {
          userId: claim.recipientId,
          title: "Arrival confirmed",
          message: `Arrival detected at the pickup point for "${claim.listing.foodName}". Show your QR code to the provider to complete collection.`,
          type: "TRACKING_ARRIVED",
        },
      ]);
    }
    return;
  }

  if (fixes !== session.consecutiveArrivalFixes) {
    await prisma.pickupTrackingSession.update({
      where: { claimId: claim.id },
      data: { consecutiveArrivalFixes: fixes },
    });
  }
}

async function evaluateDelay(
  claim: ClaimWithListing,
  route: { available: boolean; durationSeconds?: number },
  actorId: string
) {
  if (!route.available || route.durationSeconds == null) return;
  const session = await prisma.pickupTrackingSession.findUnique({ where: { claimId: claim.id } });
  if (!session) return;

  const now = new Date();
  const etaMs = route.durationSeconds * 1000;
  const bufferMs = TRACKING_CONFIG.pickupBufferMinutes * 60_000;
  const expectedArrival = now.getTime() + etaMs + bufferMs;
  const delayed = expectedArrival > claim.listing.pickupDeadline.getTime();

  if (!delayed) {
    // On time again → re-arm the delay alert after a quiet period
    if (session.delayAlertSentAt) {
      const quietMs = now.getTime() - session.delayAlertSentAt.getTime();
      if (quietMs > TRACKING_CONFIG.delayRearmMinutes * 60_000) {
        await prisma.pickupTrackingSession.update({
          where: { claimId: claim.id },
          data: { delayAlertSentAt: null },
        });
      }
    }
    return;
  }

  if (session.delayAlertSentAt) return; // deduplicated

  await prisma.pickupTrackingSession.update({
    where: { claimId: claim.id },
    data: { delayAlertSentAt: now },
  });
  await audit(prisma, "TRACKING_DELAYED", "PickupTrackingSession", session.id, actorId, {
    claimId: claim.id,
    etaSeconds: route.durationSeconds,
  });
  const etaMinutes = Math.max(1, Math.round(route.durationSeconds / 60));
  await notifyProvider(claim, "Pickup may be late", `The recipient's ETA (${etaMinutes} min plus buffer) may miss the deadline for "${claim.listing.foodName}".`, "TRACKING_DELAYED");
  await createNotifications(prisma, [
    {
      userId: claim.recipientId,
      title: "You might miss the pickup deadline",
      message: `Your ETA (~${etaMinutes} min) plus the safety buffer exceeds the pickup deadline for "${claim.listing.foodName}". Consider hurrying or cancelling so the food returns to available.`,
      type: "TRACKING_DELAYED",
    },
  ]);
}

async function evaluateStale(
  claim: ClaimWithListing,
  actorId: string | null,
  now: Date,
  stale: boolean
) {
  const session = await prisma.pickupTrackingSession.findUnique({ where: { claimId: claim.id } });
  if (!session || !session.lastLocationAt) return;

  if (!stale) {
    // fresh fix clears any stale episode
    if (session.staleAlertSentAt) {
      await prisma.pickupTrackingSession.update({
        where: { claimId: claim.id },
        data: { staleAlertSentAt: null },
      });
    }
    return;
  }

  if (session.staleAlertSentAt) return; // deduplicated per episode
  await prisma.pickupTrackingSession.update({
    where: { claimId: claim.id },
    data: { staleAlertSentAt: now },
  });
  await audit(prisma, "TRACKING_STALE", "PickupTrackingSession", session.id, actorId, { claimId: claim.id });
  await notifyProvider(claim, "Live location lost", `Live tracking for "${claim.listing.foodName}" stopped updating — the recipient's device may have suspended sharing.`, "TRACKING_STALE");
}

// ---------------------------------------------------------------------------
// Read — recipient owner or listing provider only (spec §6)
// ---------------------------------------------------------------------------

async function notifyProvider(claim: ClaimWithListing, title: string, message: string, type: Parameters<typeof createNotifications>[1][number]["type"]) {
  await createNotifications(prisma, [
    { userId: claim.listing.providerId, title, message, type },
  ]);
}

export async function getTrackingState(
  claimId: string,
  userId: string,
  role: "RECIPIENT" | "PROVIDER"
) {
  const claim = await loadClaimWithListing(claimId);
  const isRecipient = claim.recipientId === userId;
  const isProvider = claim.listing.providerId === userId;
  if (!isRecipient && !isProvider) {
    throw new AppError(ERROR_CODES.FORBIDDEN, "You are not part of this pickup.", 403);
  }

  const session = await prisma.pickupTrackingSession.findUnique({ where: { claimId } });
  const now = new Date();
  const trackable = isClaimTrackable(claim, now);
  const activeLike = session ? session.status === "ACTIVE" || session.status === "ARRIVED" : false;

  // Coordinates are returned ONLY for an active, eligible session (spec §6/§15)
  const showLocation = !!session && activeLike && trackable && session.lastLatitude != null && session.lastLongitude != null;
  const stale =
    showLocation &&
    session!.lastLocationAt != null &&
    now.getTime() - session!.lastLocationAt!.getTime() > TRACKING_CONFIG.staleThresholdSeconds * 1000;

  // A polling reader observing staleness triggers the deduplicated alert.
  if (stale) {
    await evaluateStale(claim, null, now, true);
  }

  // Display status: live statuses stay live only while the claim is eligible;
  // otherwise the journey is effectively over (cron will finalise the row).
  const displayStatus = !trackable && (session?.status === "ACTIVE" || session?.status === "ARRIVED")
    ? "STOPPED"
    : session?.status;

  return {
    claim: {
      id: claim.id,
      quantity: claim.quantity,
      status: claim.status,
      foodName: claim.listing.foodName,
      unit: claim.listing.unit,
    },
    destination: {
      latitude: claim.listing.latitude,
      longitude: claim.listing.longitude,
      address: claim.listing.pickupAddress,
    },
    pickupDeadline: claim.listing.pickupDeadline.toISOString(),
    tracking: session
      ? {
          status: displayStatus,
          startedAt: session.startedAt.toISOString(),
          stoppedAt: session.stoppedAt?.toISOString() ?? null,
          lastLocationAt: session.lastLocationAt?.toISOString() ?? null,
          accuracyMeters: showLocation ? session.accuracyMeters : null,
          recipientLocation: showLocation
            ? { latitude: session.lastLatitude!, longitude: session.lastLongitude! }
            : null,
          route: showLocation && session.routeAvailable
            ? {
                available: true,
                distanceMeters: session.routeDistanceMeters,
                durationSeconds: session.routeDurationSeconds,
                geometry: session.routeGeometry,
              }
            : { available: false as const },
          arrivalDetectedAt: session.arrivalDetectedAt?.toISOString() ?? null,
          delayLikely:
            showLocation &&
            session.routeAvailable &&
            session.routeDurationSeconds != null &&
            now.getTime() + session.routeDurationSeconds * 1000 + TRACKING_CONFIG.pickupBufferMinutes * 60_000 >
              claim.listing.pickupDeadline.getTime(),
          stale: !!stale,
        }
      : null,
    viewerRole: isRecipient ? "RECIPIENT" : "PROVIDER",
  };
}

// ---------------------------------------------------------------------------
// Stop / lifecycle (spec §6, §16) — clears coordinates (retention: immediate)
// ---------------------------------------------------------------------------

export async function stopTracking(
  claimId: string,
  recipientId: string,
  opts: { notifyProvider?: boolean } = {}
) {
  const claim = await loadClaimWithListing(claimId);
  if (claim.recipientId !== recipientId) {
    throw new AppError(ERROR_CODES.FORBIDDEN, "This is not your claim.", 403);
  }
  const session = await stopTrackingForClaim(claimId, "STOPPED", recipientId, "recipient_stopped");
  if (opts.notifyProvider !== false && session) {
    await notifyProvider(claim, "Live tracking stopped", `The recipient stopped sharing live location for "${claim.listing.foodName}".`, "TRACKING_STOPPED");
  }
  return session;
}

/**
 * Idempotent lifecycle stop usable from any transaction or service
 * (cancel, expiry, collection, no-show, cron cleanup). Returns the session
 * (or null when none exists / already terminal). Clears live coordinates.
 */
export async function stopTrackingForClaim(
  claimId: string,
  status: "STOPPED" | "COMPLETED" | "CANCELLED",
  actorId: string | null,
  reason: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma
): Promise<PickupTrackingSession | null> {
  const session = await tx.pickupTrackingSession.findUnique({ where: { claimId } });
  if (!session) return null;
  if (["STOPPED", "COMPLETED", "CANCELLED"].includes(session.status) && session.stoppedAt) {
    return session; // already terminal — idempotent
  }

  const updated = await tx.pickupTrackingSession.update({
    where: { claimId },
    data: {
      status,
      stoppedAt: new Date(),
      // Retention policy: live coordinates cleared immediately on stop.
      lastLatitude: null,
      lastLongitude: null,
      accuracyMeters: null,
      headingDegrees: null,
      speedMps: null,
      routeAvailable: false,
      routeDistanceMeters: null,
      routeDurationSeconds: null,
      routeGeometry: Prisma.JsonNull,
      consecutiveArrivalFixes: 0,
    },
  });

  await audit(
    tx,
    status === "COMPLETED" ? "TRACKING_COMPLETED" : "TRACKING_STOPPED",
    "PickupTrackingSession",
    updated.id,
    actorId,
    { claimId, reason, finalStatus: status }
  );
  return updated;
}

/**
 * Cron cleanup (spec §16): stop ACTIVE sessions that are stale, belong to
 * ineligible claims, or whose listing deadline passed. Server-time based and
 * idempotent; never marks claims collected.
 */
export async function cleanupTrackingSessions(now = new Date()) {
  const staleCutoff = new Date(now.getTime() - TRACKING_CONFIG.autoStopStaleMinutes * 60_000);

  const candidates = await prisma.pickupTrackingSession.findMany({
    where: { status: { in: ["ACTIVE", "ARRIVED"] } },
    include: { claim: { include: { listing: true } } },
    take: 500,
  });

  let stopped = 0;
  for (const session of candidates) {
    const claim = session.claim as ClaimWithListing;
    const ineligible = !isClaimTrackable(claim, now);
    const tooStale =
      session.lastLocationAt == null
        ? now.getTime() - session.startedAt.getTime() > TRACKING_CONFIG.autoStopStaleMinutes * 60_000
        : session.lastLocationAt < staleCutoff;

    if (ineligible) {
      const status =
        claim.status === "COLLECTED" ? "COMPLETED" : claim.status === "CANCELLED" || claim.listing.status === "CANCELLED" ? "CANCELLED" : "STOPPED";
      await stopTrackingForClaim(session.claimId, status, null, "claim_ineligible");
      stopped += 1;
    } else if (tooStale) {
      await stopTrackingForClaim(session.claimId, "STOPPED", null, "stale_session_timeout");
      stopped += 1;
    }
  }
  return { stopped };
}
