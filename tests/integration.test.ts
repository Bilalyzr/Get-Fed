import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import {
  createClaim,
  cancelClaim,
  confirmCollectionByQr,
  markNoShow,
} from "@/services/claim.service";
import { createListing, cancelListing } from "@/services/listing.service";
import { expireOverdueListings } from "@/lib/expiry";
import { signPayload } from "@/services/qr.service";

// ---------------------------------------------------------------------------
// Integration tests (PRD §55/§56) — the 10 critical edge cases, executed
// against a real PostgreSQL database with real transactions.
// ---------------------------------------------------------------------------

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL } },
});

let providerId: string;
let verifiedRecipientId: string;
let otherVerifiedRecipientId: string;
let pendingRecipientId: string;

async function makeUser(email: string, role: "PROVIDER" | "RECIPIENT", status: "VERIFIED" | "PENDING") {
  return prisma.user.create({
    data: {
      name: `Test ${email}`,
      email,
      phone: "+91 90000 00000",
      passwordHash: await bcrypt.hash("Password123!", 10),
      role,
      organisationName: `Org ${email}`,
      verificationStatus: status,
      latitude: 12.9716,
      longitude: 77.5946,
    },
  });
}

async function makeListing(providerId: string, overrides: Record<string, unknown> = {}) {
  return createListing(providerId, {
    foodName: "Test Meal",
    description: "Integration test listing",
    category: "COOKED_MEALS",
    totalQuantity: 100,
    unit: "PORTIONS",
    preparedAt: new Date(Date.now() - 30 * 60_000),
    availableFrom: new Date(),
    pickupDeadline: new Date(Date.now() + 2 * 60 * 60_000),
    pickupAddress: "Test Address 123",
    latitude: 12.9716,
    longitude: 77.5946,
    notes: "",
    allergenNotes: "",
    packagingType: "",
    ...overrides,
  });
}

function expectCode(error: unknown, code: string): void {
  expect(error).toMatchObject({ code });
}

beforeAll(async () => {
  providerId = (await makeUser(`provider-${Date.now()}@test.dev`, "PROVIDER", "VERIFIED")).id;
  verifiedRecipientId = (await makeUser(`rec-${Date.now()}@test.dev`, "RECIPIENT", "VERIFIED")).id;
  otherVerifiedRecipientId = (await makeUser(`rec2-${Date.now()}@test.dev`, "RECIPIENT", "VERIFIED")).id;
  pendingRecipientId = (await makeUser(`pending-${Date.now()}@test.dev`, "RECIPIENT", "PENDING")).id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ---------------------------------------------------------------------------
// TEST 1 — Concurrent claims cannot overbook (PRD §55 Test 1, §22)
// ---------------------------------------------------------------------------
describe("Test 1: concurrent claims (20 remain, A and B each claim 15)", () => {
  it("only one claim succeeds; quantity never goes negative", async () => {
    const listing = await makeListing(providerId, { totalQuantity: 20 });

    const results = await Promise.allSettled([
      createClaim(listing.id, verifiedRecipientId, 15),
      createClaim(listing.id, otherVerifiedRecipientId, 15),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    expectCode(
      (rejected[0] as PromiseRejectedResult).reason,
      "INSUFFICIENT_QUANTITY"
    );

    const after = await prisma.foodListing.findUniqueOrThrow({ where: { id: listing.id } });
    expect(after.availableQuantity).toBe(5); // 20 - 15
    expect(after.availableQuantity).toBeGreaterThanOrEqual(0);
    expect(after.status).toBe("PARTIALLY_RESERVED");
  });
});

// ---------------------------------------------------------------------------
// TEST 2 — Claim larger than availability is rejected (PRD §55 Test 2)
// ---------------------------------------------------------------------------
describe("Test 2: claim too large (12 available, request 20)", () => {
  it("rejects with INSUFFICIENT_QUANTITY and a friendly message", async () => {
    const listing = await makeListing(providerId, { totalQuantity: 12 });

    const error = await createClaim(listing.id, verifiedRecipientId, 20).catch((e) => e);
    expectCode(error, "INSUFFICIENT_QUANTITY");
    expect(error.message).toContain("12");

    const after = await prisma.foodListing.findUniqueOrThrow({ where: { id: listing.id } });
    expect(after.availableQuantity).toBe(12);
  });
});

// ---------------------------------------------------------------------------
// TEST 3 — Expired listings cannot be claimed (PRD §55 Test 3, §25)
// ---------------------------------------------------------------------------
describe("Test 3: expired listing rejects claims with LISTING_EXPIRED", () => {
  it("rejects after the deadline passes and expiry worker runs", async () => {
    const listing = await makeListing(providerId, {
      pickupDeadline: new Date(Date.now() + 60_000),
    });

    // Force the deadline into the past.
    await prisma.foodListing.update({
      where: { id: listing.id },
      data: { pickupDeadline: new Date(Date.now() - 60_000) },
    });

    await expireOverdueListings();

    const expired = await prisma.foodListing.findUniqueOrThrow({ where: { id: listing.id } });
    expect(expired.status).toBe("EXPIRED");
    expect(expired.availableQuantity).toBe(0);

    const error = await createClaim(listing.id, verifiedRecipientId, 5).catch((e) => e);
    expectCode(error, "LISTING_EXPIRED");
  });
});

// ---------------------------------------------------------------------------
// TEST 4 — Cancellation before deadline restores quantity (PRD §55 Test 4, §24)
// ---------------------------------------------------------------------------
describe("Test 4: cancellation before deadline restores quantity", () => {
  it("available returns from 10 to 30 after cancelling 20", async () => {
    const listing = await makeListing(providerId, { totalQuantity: 30 });

    const claim = await createClaim(listing.id, verifiedRecipientId, 20);
    let after = await prisma.foodListing.findUniqueOrThrow({ where: { id: listing.id } });
    expect(after.availableQuantity).toBe(10);
    expect(after.status).toBe("PARTIALLY_RESERVED");

    const result = await cancelClaim(claim.claimId, verifiedRecipientId);
    expect(result.restored).toBe(true);

    after = await prisma.foodListing.findUniqueOrThrow({ where: { id: listing.id } });
    expect(after.availableQuantity).toBe(30);
    expect(after.status).toBe("AVAILABLE");

    const cancelledClaim = await prisma.claim.findUniqueOrThrow({ where: { id: claim.claimId } });
    expect(cancelledClaim.status).toBe("CANCELLED");
  });
});

// ---------------------------------------------------------------------------
// TEST 5 — Cancellation after deadline does NOT restore (PRD §55 Test 5, §24)
// ---------------------------------------------------------------------------
describe("Test 5: cancellation after deadline does not restore quantity", () => {
  it("keeps the listing expired with zero availability", async () => {
    const listing = await makeListing(providerId, { totalQuantity: 25 });
    const claim = await createClaim(listing.id, verifiedRecipientId, 15);

    // Deadline passes and expiry worker marks EXPIRED.
    await prisma.foodListing.update({
      where: { id: listing.id },
      data: { pickupDeadline: new Date(Date.now() - 60_000) },
    });
    await expireOverdueListings();

    const result = await cancelClaim(claim.claimId, verifiedRecipientId);
    expect(result.restored).toBe(false);

    const after = await prisma.foodListing.findUniqueOrThrow({ where: { id: listing.id } });
    expect(after.status).toBe("EXPIRED");
    expect(after.availableQuantity).toBe(0);

    const closed = await prisma.claim.findUniqueOrThrow({ where: { id: claim.claimId } });
    expect(["CANCELLED", "EXPIRED"]).toContain(closed.status);
  });
});

// ---------------------------------------------------------------------------
// TEST 6 — QR double scan rejected (PRD §55 Test 6, §28)
// ---------------------------------------------------------------------------
describe("Test 6: QR double scan", () => {
  it("first scan succeeds, second rejected with ALREADY_COLLECTED", async () => {
    const listing = await makeListing(providerId, { totalQuantity: 40 });
    const claim = await createClaim(listing.id, verifiedRecipientId, 40);

    const first = await confirmCollectionByQr(providerId, claim.claimId, claim.claimToken);
    expect(first.quantity).toBe(40);
    expect(first.foodName).toBe("Test Meal");

    const second = await confirmCollectionByQr(providerId, claim.claimId, claim.claimToken).catch((e) => e);
    expectCode(second, "ALREADY_COLLECTED");

    const listingAfter = await prisma.foodListing.findUniqueOrThrow({ where: { id: listing.id } });
    expect(listingAfter.status).toBe("COLLECTED");
  });

  it("wrong token is rejected with INVALID_TOKEN", async () => {
    const listing = await makeListing(providerId, { totalQuantity: 10 });
    const claim = await createClaim(listing.id, verifiedRecipientId, 5);

    const error = await confirmCollectionByQr(
      providerId,
      claim.claimId,
      randomBytes(32).toString("base64url")
    ).catch((e) => e);
    expectCode(error, "INVALID_TOKEN");
  });

  it("an unauthorized scanner (not the listing owner) is rejected", async () => {
    const listing = await makeListing(providerId, { totalQuantity: 10 });
    const claim = await createClaim(listing.id, verifiedRecipientId, 5);

    const error = await confirmCollectionByQr(
      otherVerifiedRecipientId,
      claim.claimId,
      claim.claimToken
    ).catch((e) => e);
    expectCode(error, "FORBIDDEN");
  });
});

// ---------------------------------------------------------------------------
// TEST 7 — Unverified recipient cannot claim (PRD §55 Test 7, §8/§13)
// ---------------------------------------------------------------------------
describe("Test 7: unverified recipient", () => {
  it("rejects a PENDING recipient at the service boundary", async () => {
    const listing = await makeListing(providerId, { totalQuantity: 50 });

    // createClaim is guarded by requireVerifiedRecipient at the API layer;
    // the engine itself re-checks the recipient's live verification status.
    const recipient = await prisma.user.findUniqueOrThrow({ where: { id: pendingRecipientId } });
    expect(recipient.verificationStatus).toBe("PENDING");

    const error = await createClaim(listing.id, pendingRecipientId, 5).catch((e) => e);
    // The engine-level guard mirrors the API guard (RECIPIENT_NOT_VERIFIED).
    expectCode(error, "RECIPIENT_NOT_VERIFIED");
  });
});

// ---------------------------------------------------------------------------
// TEST 8 — Provider cannot claim own listing (PRD §55 Test 8, §47)
// ---------------------------------------------------------------------------
describe("Test 8: provider claims own listing", () => {
  it("rejects with SELF_CLAIM", async () => {
    const listing = await makeListing(providerId, { totalQuantity: 50 });
    const error = await createClaim(listing.id, providerId, 10).catch((e) => e);
    expectCode(error, "SELF_CLAIM");
  });
});

// ---------------------------------------------------------------------------
// TEST 9 — Unauthorized listing modification (PRD §55 Test 9, §47)
// ---------------------------------------------------------------------------
describe("Test 9: recipient cannot modify provider listing", () => {
  it("updateListing by a non-owner is FORBIDDEN", async () => {
    const listing = await makeListing(providerId, { totalQuantity: 50 });

    const { updateListing } = await import("@/services/listing.service");
    const error = await updateListing(listing.id, verifiedRecipientId, {
      foodName: "Hacked Name",
    }).catch((e) => e);
    expectCode(error, "FORBIDDEN");

    const unchanged = await prisma.foodListing.findUniqueOrThrow({ where: { id: listing.id } });
    expect(unchanged.foodName).toBe("Test Meal");
  });
});

// ---------------------------------------------------------------------------
// TEST 10 — Provider cancellation cascades (PRD §55 Test 10, §16)
// ---------------------------------------------------------------------------
describe("Test 10: provider cancels listing with active claims", () => {
  it("cancels claims, notifies recipients and writes audit logs", async () => {
    const listing = await makeListing(providerId, { totalQuantity: 50 });
    const claimA = await createClaim(listing.id, verifiedRecipientId, 20);
    const claimB = await createClaim(listing.id, otherVerifiedRecipientId, 10);

    await cancelListing(listing.id, providerId);

    const after = await prisma.foodListing.findUniqueOrThrow({ where: { id: listing.id } });
    expect(after.status).toBe("CANCELLED");
    expect(after.availableQuantity).toBe(0);

    const claims = await prisma.claim.findMany({ where: { listingId: listing.id } });
    expect(claims.map((c) => c.status)).toEqual(["CANCELLED", "CANCELLED"]);

    // Recipients notified (PRD §16 step 3).
    const notifications = await prisma.notification.findMany({
      where: {
        userId: { in: [verifiedRecipientId, otherVerifiedRecipientId] },
        type: "PROVIDER_CANCELLATION",
      },
    });
    expect(notifications.length).toBe(2);

    // Audit trail (PRD §16 step 4).
    const auditLogs = await prisma.auditLog.findMany({
      where: { action: "FOOD_LISTING_CANCELLED", entityId: listing.id },
    });
    expect(auditLogs.length).toBe(1);
    expect(claimA.claimId).toBeTruthy();
    expect(claimB.claimId).toBeTruthy();

    // QR collection impossible afterwards (PRD §16 step 5).
    const scan = await confirmCollectionByQr(providerId, claimA.claimId, claimA.claimToken).catch((e) => e);
    expectCode(scan, "CLAIM_CANCELLED");
  });
});

// ---------------------------------------------------------------------------
// End-to-end demo scenario (PRD §54): 60 meals → claim 40 → scan → analytics
// ---------------------------------------------------------------------------
describe("PRD §54 demo scenario end-to-end", () => {
  it("60-meal listing → 40 claimed → QR verified → 40 meals recovered", async () => {
    // 1. Provider publishes 60-meal listing.
    const listing = await createListing(providerId, {
      foodName: "Vegetable Biryani",
      description: "Symposium buffet surplus",
      category: "COOKED_MEALS",
      totalQuantity: 60,
      unit: "PORTIONS",
      preparedAt: new Date(Date.now() - 60 * 60_000),
      availableFrom: new Date(),
      pickupDeadline: new Date(Date.now() + 90 * 60_000),
      pickupAddress: "Alumni Hall",
      latitude: 12.9716,
      longitude: 77.5946,
      notes: "",
      allergenNotes: "",
      packagingType: "",
    });
    expect(listing.status).toBe("AVAILABLE");
    expect(listing.availableQuantity).toBe(60);

    // 2. Verified recipient claims 40.
    const claim = await createClaim(listing.id, verifiedRecipientId, 40);
    expect(claim.availableQuantity).toBe(20);
    expect(claim.listingStatus).toBe("PARTIALLY_RESERVED");

    const mid = await prisma.foodListing.findUniqueOrThrow({ where: { id: listing.id } });
    expect(mid.status).toBe("PARTIALLY_RESERVED");

    // 3. QR generation — signed envelope contains the secure token.
    const signed = signPayload({
      claimId: claim.claimId,
      listingId: listing.id,
      token: claim.claimToken,
    });
    expect(signed.length).toBeGreaterThan(50);

    // 4. Provider scans; backend verifies and marks COLLECTED.
    const collection = await confirmCollectionByQr(providerId, claim.claimId, claim.claimToken);
    expect(collection.quantity).toBe(40);
    expect(collection.foodName).toBe("Vegetable Biryani");

    // 5. Analytics: 40 meals recovered for this provider.
    const collectedClaims = await prisma.claim.findMany({
      where: { listing: { providerId }, status: "COLLECTED" },
    });
    const recovered = collectedClaims.reduce((sum, c) => sum + c.quantity, 0);
    expect(recovered).toBeGreaterThanOrEqual(40);

    // Audit log for the collection exists.
    const audit = await prisma.auditLog.findFirst({
      where: { action: "COLLECTION_CONFIRMED", entityId: claim.claimId },
    });
    expect(audit).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// No-show handling (PRD §23) — quantity released while still claimable.
// ---------------------------------------------------------------------------
describe("no-show releases quantity", () => {
  it("marks NO_SHOW and restores availability before deadline", async () => {
    const listing = await makeListing(providerId, { totalQuantity: 20 });
    const claim = await createClaim(listing.id, verifiedRecipientId, 8);

    const result = await markNoShow(claim.claimId, providerId);
    expect(result.quantityReleased).toBe(8);

    const after = await prisma.foodListing.findUniqueOrThrow({ where: { id: listing.id } });
    expect(after.availableQuantity).toBe(20);
    expect(after.status).toBe("AVAILABLE");
  });
});
