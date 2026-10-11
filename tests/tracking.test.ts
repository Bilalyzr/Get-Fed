import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import {
  startTracking,
  submitLocation,
  getTrackingState,
  stopTracking,
  stopTrackingForClaim,
  cleanupTrackingSessions,
  type LocationInput,
} from "@/services/tracking.service";
import { createClaim, cancelClaim, confirmCollectionByQr, markNoShow } from "@/services/claim.service";
import { createListing, cancelListing } from "@/services/listing.service";
import { expireOverdueListings } from "@/lib/expiry";

// ---------------------------------------------------------------------------
// Live pickup tracking integration tests (spec §18) against the real DB.
// Routing is mocked at the fetch boundary with OSRM-shaped responses.
// ---------------------------------------------------------------------------

const prisma = new PrismaClient();

let providerId: string;
let recipientId: string;
let otherRecipientId: string;
let otherProviderId: string;

async function makeUser(email: string, role: "PROVIDER" | "RECIPIENT") {
  return prisma.user.create({
    data: {
      name: `Track ${email}`,
      email,
      phone: "+91 90000 00000",
      passwordHash: await bcrypt.hash("Password123!", 10),
      role,
      organisationName: `Org ${email}`,
      verificationStatus: "VERIFIED",
      latitude: 12.9716,
      longitude: 77.5946,
    },
  });
}

// Pickup point ~350 m north of the recipient start — walkable arrival journey.
const PICKUP = { latitude: 12.975, longitude: 77.5946 };
const START = { latitude: 12.9716, longitude: 77.5946 };
const NEAR_PICKUP = { latitude: 12.9748, longitude: 77.5946 }; // ~22 m away
const FAR_AWAY = { latitude: 12.9, longitude: 77.5946 }; // ~8 km south

async function makeClaim(overrides: Record<string, unknown> = {}) {
  const listing = await createListing(providerId, {
    foodName: "Tracking Test Meal",
    description: "Live pickup tracking verification listing",
    category: "COOKED_MEALS",
    totalQuantity: 30,
    unit: "PORTIONS",
    preparedAt: new Date(Date.now() - 30 * 60_000),
    availableFrom: new Date(),
    pickupDeadline: new Date(Date.now() + 2 * 60 * 60_000),
    pickupAddress: "Tracking Test Point",
    latitude: PICKUP.latitude,
    longitude: PICKUP.longitude,
    notes: "",
    allergenNotes: "",
    packagingType: "",
    ...overrides,
  });
  const result = await createClaim(listing.id, recipientId, 10);
  const claim = await prisma.claim.findUniqueOrThrow({ where: { id: result.claimId } });
  return { listing, claim };
}

function fix(
  point: { latitude: number; longitude: number },
  accuracy = 10
): LocationInput {
  return {
    latitude: point.latitude,
    longitude: point.longitude,
    accuracyMeters: accuracy,
    headingDegrees: null,
    speedMps: null,
    clientTimestamp: new Date(),
  };
}

// ---- OSRM-shaped fetch mock ----------------------------------------------
const realFetch = global.fetch;
let mockRoute: { distance: number; duration: number } | null = null;
let routingFailures = 0;

function installFetchMock() {
  global.fetch = (async (input: unknown) => {
    const url = typeof input === "string" ? input : (input as Request).url ?? "";
    if (url.includes("/route/v1/driving/")) {
      if (routingFailures > 0) {
        routingFailures -= 1;
        return new Response(JSON.stringify({ code: "NoRoute" }), { status: 500 });
      }
      const d = mockRoute ?? { distance: 380, duration: 300 };
      return new Response(
        JSON.stringify({
          code: "Ok",
          routes: [
            {
              distance: d.distance,
              duration: d.duration,
              geometry: { coordinates: [[77.5946, 12.9716], [77.5946, 12.975]] },
            },
          ],
        }),
        { status: 200 }
      );
    }
    return new Response("{}", { status: 200 });
  }) as typeof fetch;
}

beforeAll(async () => {
  providerId = (await makeUser(`track-p-${Date.now()}@test.dev`, "PROVIDER")).id;
  recipientId = (await makeUser(`track-r-${Date.now()}@test.dev`, "RECIPIENT")).id;
  otherRecipientId = (await makeUser(`track-r2-${Date.now()}@test.dev`, "RECIPIENT")).id;
  otherProviderId = (await makeUser(`track-p2-${Date.now()}@test.dev`, "PROVIDER")).id;
  installFetchMock();
});

afterEach(() => {
  mockRoute = null;
  routingFailures = 0;
});

// ---------------------------------------------------------------------------
// 1. Eligible start + full journey + arrival
// ---------------------------------------------------------------------------
describe("tracking lifecycle", () => {
  it("recipient starts tracking an eligible claim and receives destination", async () => {
    const { claim } = await makeClaim();
    const session = await startTracking(claim.id, recipientId);
    expect(session.status).toBe("ACTIVE");

    const state = await getTrackingState(claim.id, recipientId, "RECIPIENT");
    expect(state.destination.latitude).toBe(PICKUP.latitude);
    expect(state.tracking?.status).toBe("ACTIVE");
    expect(state.tracking?.recipientLocation).toBeNull(); // no fix yet
  });

  it("persists location, computes road route, and detects arrival after 2 qualifying fixes", async () => {
    const { claim } = await makeClaim();
    await startTracking(claim.id, recipientId);

    await submitLocation(claim.id, recipientId, fix(START));
    const mid = await getTrackingState(claim.id, recipientId, "RECIPIENT");
    expect(mid.tracking?.recipientLocation).toEqual({ latitude: START.latitude, longitude: START.longitude });
    expect(mid.tracking?.route.available).toBe(true);
    expect(mid.tracking?.route.distanceMeters).toBe(380);

    // Two qualifying fixes near the pickup point → ARRIVED
    await submitLocation(claim.id, recipientId, fix(NEAR_PICKUP));
    const after = await submitLocation(claim.id, recipientId, fix(NEAR_PICKUP));
    expect(after.tracking?.status).toBe("ARRIVED");

    // Provider sees the arrived state too
    const providerView = await getTrackingState(claim.id, providerId, "PROVIDER");
    expect(providerView.tracking?.status).toBe("ARRIVED");

    // Arrival did NOT mark the claim collected (spec §18.16)
    const claimRow = await prisma.claim.findUniqueOrThrow({ where: { id: claim.id } });
    expect(claimRow.status).toBe("RESERVED");

    // Arrival notification exists exactly once (deduplicated)
    const alerts = await prisma.notification.count({
      where: { userId: providerId, type: "TRACKING_ARRIVED" },
    });
    expect(alerts).toBeGreaterThanOrEqual(1);
    const arrivedAudit = await prisma.auditLog.count({
      where: { action: "TRACKING_ARRIVED", entityId: (await prisma.pickupTrackingSession.findUnique({ where: { claimId: claim.id } }))!.id },
    });
    expect(arrivedAudit).toBe(1);
  });

  it("arrival is not triggered by a single qualifying fix or poor accuracy", async () => {
    const { claim } = await makeClaim();
    await startTracking(claim.id, recipientId);
    await submitLocation(claim.id, recipientId, fix(NEAR_PICKUP, 80)); // bad accuracy
    let state = await getTrackingState(claim.id, recipientId, "RECIPIENT");
    expect(state.tracking?.status).toBe("ACTIVE");
    await submitLocation(claim.id, recipientId, fix(NEAR_PICKUP)); // first good fix only
    state = await getTrackingState(claim.id, recipientId, "RECIPIENT");
    expect(state.tracking?.status).toBe("ACTIVE"); // needs 2 consecutive
    await submitLocation(claim.id, recipientId, fix(FAR_AWAY)); // resets streak
    await submitLocation(claim.id, recipientId, fix(NEAR_PICKUP));
    state = await getTrackingState(claim.id, recipientId, "RECIPIENT");
    expect(state.tracking?.status).toBe("ACTIVE");
  });

  it("stop clears live coordinates and blocks further submissions", async () => {
    const { claim } = await makeClaim();
    await startTracking(claim.id, recipientId);
    await submitLocation(claim.id, recipientId, fix(START));

    await stopTracking(claim.id, recipientId);
    const row = await prisma.pickupTrackingSession.findUniqueOrThrow({ where: { claimId: claim.id } });
    expect(row.status).toBe("STOPPED");
    expect(row.lastLatitude).toBeNull();
    expect(row.routeGeometry).toBeNull();
    expect(row.stoppedAt).not.toBeNull();

    const state = await getTrackingState(claim.id, recipientId, "RECIPIENT");
    expect(state.tracking?.recipientLocation).toBeNull();

    const error = await submitLocation(claim.id, recipientId, fix(START)).catch((e) => e);
    expect(error.code).toBe("INVALID_STATE");
  });

  it("stopped session can resume after revalidation", async () => {
    const { claim } = await makeClaim();
    await startTracking(claim.id, recipientId);
    await stopTracking(claim.id, recipientId);
    const resumed = await startTracking(claim.id, recipientId);
    expect(resumed.status).toBe("ACTIVE");
    expect(resumed.lastLatitude).toBeNull(); // coordinates stayed cleared
  });
});

// ---------------------------------------------------------------------------
// 2. Authorization
// ---------------------------------------------------------------------------
describe("tracking authorization", () => {
  it("another recipient cannot read or submit", async () => {
    const { claim } = await makeClaim();
    await startTracking(claim.id, recipientId);
    await submitLocation(claim.id, recipientId, fix(START));

    const read = getTrackingState(claim.id, otherRecipientId, "RECIPIENT").catch((e) => e);
    expect((await read).code).toBe("FORBIDDEN");

    const submit = submitLocation(claim.id, otherRecipientId, fix(START)).catch((e) => e);
    expect((await submit).code).toBe("FORBIDDEN");
  });

  it("unrelated provider cannot access the session", async () => {
    const { claim } = await makeClaim();
    await startTracking(claim.id, recipientId);
    const error = await getTrackingState(claim.id, otherProviderId, "PROVIDER").catch((e) => e);
    expect(error.code).toBe("FORBIDDEN");
  });

  it("provider never sees coordinates once sharing stops", async () => {
    const { claim } = await makeClaim();
    await startTracking(claim.id, recipientId);
    await submitLocation(claim.id, recipientId, fix(START));
    await stopTracking(claim.id, recipientId);
    const view = await getTrackingState(claim.id, providerId, "PROVIDER");
    expect(view.tracking?.recipientLocation).toBeNull();
    expect(view.tracking?.route.available).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. Validation + routing resilience
// ---------------------------------------------------------------------------
describe("tracking validation and routing", () => {
  it("rejects invalid coordinates and accuracy", async () => {
    const { claim } = await makeClaim();
    await startTracking(claim.id, recipientId);
    const bad1 = await submitLocation(claim.id, recipientId, fix({ latitude: 999, longitude: 0 })).catch((e) => e);
    expect(bad1.code).toBe("VALIDATION_ERROR");
    const bad2 = await submitLocation(claim.id, recipientId, fix(START, 9999)).catch((e) => e);
    expect(bad2.code).toBe("VALIDATION_ERROR");
  });

  it("rejects stale client timestamps", async () => {
    const { claim } = await makeClaim();
    await startTracking(claim.id, recipientId);
    const stale = fix(START);
    stale.clientTimestamp = new Date(Date.now() - 30 * 60_000);
    const error = await submitLocation(claim.id, recipientId, stale).catch((e) => e);
    expect(error.code).toBe("VALIDATION_ERROR");
  });

  it("routing failure produces a safe unavailable state (never fake road data)", async () => {
    const { claim } = await makeClaim();
    await startTracking(claim.id, recipientId);
    routingFailures = 2; // both recalculation attempts fail
    const state = await submitLocation(claim.id, recipientId, fix(START));
    expect(state.tracking?.route.available).toBe(false);
    expect(state.tracking?.recipientLocation).not.toBeNull(); // location still tracked
  });

  it("delay alert fires once when ETA + buffer misses the deadline", async () => {
    const { claim } = await makeClaim({
      pickupDeadline: new Date(Date.now() + 6 * 60_000), // only 6 minutes left
    });
    await startTracking(claim.id, recipientId);
    mockRoute = { distance: 5000, duration: 1500 }; // 25-minute ETA
    await submitLocation(claim.id, recipientId, fix(START));
    const first = await getTrackingState(claim.id, recipientId, "RECIPIENT");
    expect(first.tracking?.delayLikely).toBe(true);

    const delayNotifs = await prisma.notification.count({
      where: { userId: recipientId, type: "TRACKING_DELAYED" },
    });
    expect(delayNotifs).toBeGreaterThanOrEqual(1);

    // Another update must NOT duplicate the alert
    await submitLocation(claim.id, recipientId, fix(START));
    const delayNotifs2 = await prisma.notification.count({
      where: { userId: recipientId, type: "TRACKING_DELAYED" },
    });
    expect(delayNotifs2).toBe(delayNotifs);
  });

  it("stale location is reported to readers after the threshold", async () => {
    const { claim } = await makeClaim();
    await startTracking(claim.id, recipientId);
    await submitLocation(claim.id, recipientId, fix(START));

    // Backdate the last fix beyond the 30s threshold
    await prisma.pickupTrackingSession.update({
      where: { claimId: claim.id },
      data: { lastLocationAt: new Date(Date.now() - 60_000) },
    });
    const state = await getTrackingState(claim.id, providerId, "PROVIDER");
    expect(state.tracking?.stale).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. Lifecycle integration (spec §18.6–7, 14–17)
// ---------------------------------------------------------------------------
describe("tracking lifecycle integration", () => {
  it("expired listing cannot start tracking; expiry stops an active session", async () => {
    const { listing, claim } = await makeClaim({
      pickupDeadline: new Date(Date.now() + 60_000),
    });
    await startTracking(claim.id, recipientId);
    await submitLocation(claim.id, recipientId, fix(START));

    await prisma.foodListing.update({
      where: { id: listing.id },
      data: { pickupDeadline: new Date(Date.now() - 60_000) },
    });
    await expireOverdueListings();

    const row = await prisma.pickupTrackingSession.findUniqueOrThrow({ where: { claimId: claim.id } });
    expect(row.status).toBe("STOPPED");
    expect(row.lastLatitude).toBeNull();

    // Restart attempt on the now-expired claim is rejected
    const error = await startTracking(claim.id, recipientId).catch((e) => e);
    expect(error.code).toBe("INVALID_STATE");
  });

  it("claim cancellation stops tracking with coordinates cleared", async () => {
    const { claim } = await makeClaim();
    await startTracking(claim.id, recipientId);
    await submitLocation(claim.id, recipientId, fix(START));
    await cancelClaim(claim.id, recipientId);

    const row = await prisma.pickupTrackingSession.findUniqueOrThrow({ where: { claimId: claim.id } });
    expect(row.status).toBe("CANCELLED");
    expect(row.lastLatitude).toBeNull();
  });

  it("provider listing cancellation stops tracking for all its claims", async () => {
    const { listing, claim } = await makeClaim();
    await startTracking(claim.id, recipientId);
    await cancelListing(listing.id, providerId);
    const row = await prisma.pickupTrackingSession.findUniqueOrThrow({ where: { claimId: claim.id } });
    expect(row.status).toBe("CANCELLED");
  });

  it("QR collection completes tracking and clears location; QR flow unchanged", async () => {
    const { claim } = await makeClaim();
    await startTracking(claim.id, recipientId);
    await submitLocation(claim.id, recipientId, fix(NEAR_PICKUP));
    await submitLocation(claim.id, recipientId, fix(NEAR_PICKUP)); // arrive

    const result = await confirmCollectionByQr(providerId, claim.id, claim.claimToken);
    expect(result.quantity).toBe(10);

    const row = await prisma.pickupTrackingSession.findUniqueOrThrow({ where: { claimId: claim.id } });
    expect(row.status).toBe("COMPLETED");
    expect(row.lastLatitude).toBeNull();

    // double-scan still rejected — QR workflow intact
    const second = await confirmCollectionByQr(providerId, claim.id, claim.claimToken).catch((e) => e);
    expect(second.code).toBe("ALREADY_COLLECTED");
  });

  it("no-show stops tracking", async () => {
    const { claim } = await makeClaim();
    await startTracking(claim.id, recipientId);
    await markNoShow(claim.id, providerId);
    const row = await prisma.pickupTrackingSession.findUniqueOrThrow({ where: { claimId: claim.id } });
    expect(row.status).toBe("STOPPED");
  });

  it("cron cleanup stops stale ACTIVE sessions idempotently", async () => {
    const { claim } = await makeClaim();
    await startTracking(claim.id, recipientId);

    // Simulate a silent session: no fix, started long ago
    await prisma.pickupTrackingSession.update({
      where: { claimId: claim.id },
      data: { startedAt: new Date(Date.now() - 30 * 60_000) },
    });
    const first = await cleanupTrackingSessions();
    expect(first.stopped).toBeGreaterThanOrEqual(1);
    const row = await prisma.pickupTrackingSession.findUniqueOrThrow({ where: { claimId: claim.id } });
    expect(row.status).toBe("STOPPED");

    // Second run is a no-op for this session
    await cleanupTrackingSessions();
    const row2 = await prisma.pickupTrackingSession.findUniqueOrThrow({ where: { claimId: claim.id } });
    expect(row2.status).toBe("STOPPED");
    expect(row2.stoppedAt?.toISOString()).toBe(row.stoppedAt?.toISOString());
  });
});

// Restore the real fetch after the suite.
afterAll(async () => {
  global.fetch = realFetch;
  // Cascade-deletes this run's listings/claims/tracking sessions — leaks
  // otherwise pile up in the demo discovery feed (see integration suite).
  await prisma.user.deleteMany({
    where: { id: { in: [providerId, recipientId, otherRecipientId, otherProviderId] } },
  });
  await prisma.$disconnect();
});
