import { describe, it, expect } from "vitest";
import {
  canTransitionListing,
  deriveListingStatus,
  canTransitionClaim,
} from "@/lib/state-machine";
import {
  haversineDistanceKm,
  distanceScore,
  estimateEtaMinutes,
} from "@/lib/distance";
import {
  calculateDistanceSubscore,
  calculateQuantitySubscore,
  calculateReliability,
  calculateTimeSubscore,
  isTimeFeasible,
} from "@/lib/matching";
import {
  generateClaimToken,
  parseQrPayload,
  signPayload,
  verifySignedPayload,
  tokenMatches,
} from "@/services/qr.service";
import { createListingSchema } from "@/lib/validators";
import { sanitizeCallbackUrl } from "@/lib/routing";

// ---------------------------------------------------------------------------
// Unit tests (PRD §56): state machines, distance, matching, QR security.
// ---------------------------------------------------------------------------

describe("listing state machine (PRD §11)", () => {
  it("allows the happy path AVAILABLE → COLLECTED", () => {
    expect(canTransitionListing("AVAILABLE", "PARTIALLY_RESERVED")).toBe(true);
    expect(canTransitionListing("PARTIALLY_RESERVED", "FULLY_RESERVED")).toBe(true);
    expect(canTransitionListing("FULLY_RESERVED", "PICKUP_IN_PROGRESS")).toBe(true);
    expect(canTransitionListing("PICKUP_IN_PROGRESS", "COLLECTED")).toBe(true);
  });

  it("allows expiry and cancellation from active states", () => {
    expect(canTransitionListing("AVAILABLE", "EXPIRED")).toBe(true);
    expect(canTransitionListing("AVAILABLE", "CANCELLED")).toBe(true);
    expect(canTransitionListing("PARTIALLY_RESERVED", "EXPIRED")).toBe(true);
    expect(canTransitionListing("FULLY_RESERVED", "CANCELLED")).toBe(true);
  });

  it("allows claim-cancellation recovery back to AVAILABLE/PARTIALLY_RESERVED", () => {
    expect(canTransitionListing("FULLY_RESERVED", "PARTIALLY_RESERVED")).toBe(true);
    expect(canTransitionListing("FULLY_RESERVED", "AVAILABLE")).toBe(true);
  });

  it("never leaves terminal states (PRD §14 invalid transitions)", () => {
    expect(canTransitionListing("COLLECTED", "AVAILABLE")).toBe(false);
    expect(canTransitionListing("EXPIRED", "RESERVED" as never)).toBe(false);
    expect(canTransitionListing("EXPIRED", "AVAILABLE")).toBe(false);
    expect(canTransitionListing("CANCELLED", "AVAILABLE")).toBe(false);
    expect(canTransitionListing("COLLECTED", "COLLECTED")).toBe(false);
  });
});

describe("status derivation from quantities (PRD §67)", () => {
  it("AVAILABLE when nothing claimed", () => {
    expect(deriveListingStatus("AVAILABLE", 100, 100)).toBe("AVAILABLE");
  });
  it("PARTIALLY_RESERVED while 0 < available < total (PRD §21 example)", () => {
    expect(deriveListingStatus("PARTIALLY_RESERVED", 100, 20)).toBe("PARTIALLY_RESERVED");
  });
  it("FULLY_RESERVED at zero", () => {
    expect(deriveListingStatus("PARTIALLY_RESERVED", 100, 0)).toBe("FULLY_RESERVED");
  });
  it("terminal states are never resurrected by quantity changes", () => {
    expect(deriveListingStatus("EXPIRED", 100, 50)).toBe("EXPIRED");
    expect(deriveListingStatus("CANCELLED", 100, 0)).toBe("CANCELLED");
    expect(deriveListingStatus("COLLECTED", 100, 100)).toBe("COLLECTED");
  });
});

describe("claim state machine (PRD §14)", () => {
  it("allows REQUESTED → RESERVED → PICKUP_IN_PROGRESS → COLLECTED", () => {
    expect(canTransitionClaim("REQUESTED", "RESERVED")).toBe(true);
    expect(canTransitionClaim("RESERVED", "PICKUP_IN_PROGRESS")).toBe(true);
    expect(canTransitionClaim("PICKUP_IN_PROGRESS", "COLLECTED")).toBe(true);
  });
  it("allows RESERVED → CANCELLED and NO_SHOW", () => {
    expect(canTransitionClaim("RESERVED", "CANCELLED")).toBe(true);
    expect(canTransitionClaim("RESERVED", "NO_SHOW")).toBe(true);
  });
  it("forbids CANCELLED → COLLECTED, COLLECTED → COLLECTED, EXPIRED → RESERVED (PRD §14)", () => {
    expect(canTransitionClaim("CANCELLED", "COLLECTED")).toBe(false);
    expect(canTransitionClaim("COLLECTED", "COLLECTED")).toBe(false);
    expect(canTransitionClaim("EXPIRED", "RESERVED")).toBe(false);
  });
});

describe("distance utilities (PRD §20/§29)", () => {
  it("haversine: zero distance for identical points", () => {
    expect(haversineDistanceKm({ latitude: 12.97, longitude: 77.59 }, { latitude: 12.97, longitude: 77.59 })).toBe(0);
  });
  it("haversine: ~1.1 km for known close points", () => {
    const d = haversineDistanceKm(
      { latitude: 12.9716, longitude: 77.5946 },
      { latitude: 12.9801, longitude: 77.6001 }
    );
    expect(d).toBeGreaterThan(0.8);
    expect(d).toBeLessThan(1.5);
  });
  it("distance score tiers (PRD §29)", () => {
    expect(distanceScore(0.5)).toBe(100);
    expect(distanceScore(1.9)).toBe(100);
    expect(distanceScore(3)).toBe(75);
    expect(distanceScore(7)).toBe(40);
    expect(distanceScore(15)).toBe(10);
  });
  it("ETA has a floor of 5 minutes", () => {
    expect(estimateEtaMinutes(0.1)).toBe(5);
    expect(estimateEtaMinutes(6)).toBe(20);
  });
});

describe("matching subscores (PRD §28–§32)", () => {
  it("quantity score is 100 inside the preference window (PRD §30)", () => {
    expect(
      calculateQuantitySubscore(60, {
        id: "x",
        userId: "x",
        maxDistanceKm: 5,
        minimumQuantity: 30,
        maximumQuantity: 100,
        availableFrom: null,
        availableUntil: null,
      })
    ).toBe(100);
  });

  it("quantity score decays below the window (PRD §30)", () => {
    const score = calculateQuantitySubscore(10, {
      id: "x",
      userId: "x",
      maxDistanceKm: 5,
      minimumQuantity: 30,
      maximumQuantity: 100,
      availableFrom: null,
      availableUntil: null,
    });
    expect(score).toBeLessThan(60);
  });

  it("time feasibility per PRD §31 example: 2:10 PM + 20 min ETA + 10 buffer < 3:30 PM", () => {
    const now = new Date("2026-01-15T14:10:00");
    const deadline = new Date("2026-01-15T15:30:00");
    expect(isTimeFeasible(now, 20, deadline, 10)).toBe(true);
  });

  it("time feasibility fails when the window cannot be met", () => {
    const now = new Date("2026-01-15T15:10:00");
    const deadline = new Date("2026-01-15T15:30:00");
    expect(isTimeFeasible(now, 20, deadline, 10)).toBe(false);
  });

  it("time subscore is zero when infeasible", () => {
    const now = new Date("2026-01-15T15:10:00");
    const deadline = new Date("2026-01-15T15:30:00");
    expect(calculateTimeSubscore(now, 20, deadline)).toBe(0);
  });

  it("reliability 18/20 (90%) maps to the top band (PRD §32)", () => {
    expect(calculateReliability({ successful: 18, total: 20 })).toBe(100);
    expect(calculateReliability({ successful: 15, total: 20 })).toBe(85); // 75% band
  });

  it("reliability never divides by zero (PRD §32)", () => {
    expect(calculateReliability({ successful: 0, total: 0 })).toBe(70);
  });
});

describe("QR security (PRD §26/§28/§81)", () => {
  it("tokens are 256-bit random and unique", () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateClaimToken()));
    expect(tokens.size).toBe(50);
    expect(generateClaimToken().length).toBeGreaterThanOrEqual(40);
  });

  it("constant-time token comparison", () => {
    const token = generateClaimToken();
    expect(tokenMatches(token, token)).toBe(true);
    expect(tokenMatches(token, generateClaimToken())).toBe(false);
  });

  it("signed payloads round-trip and reject tampering", () => {
    const payload = { claimId: "claim-1", listingId: "listing-1", token: generateClaimToken() };
    const signed = signPayload(payload);
    expect(verifySignedPayload(signed)).toEqual(payload);
    // Tamper with the body but keep the signature.
    const [body, sig] = signed.split(".");
    const tampered = `${Buffer.from('{"claimId":"evil"}').toString("base64url")}.${sig}`;
    expect(verifySignedPayload(tampered)).toBeNull();
    expect(verifySignedPayload("garbage")).toBeNull();
  });

  it("parses only well-formed QR payloads", () => {
    expect(parseQrPayload(JSON.stringify({ claimId: "a", listingId: "b", token: "x".repeat(16) }))).not.toBeNull();
    expect(parseQrPayload(JSON.stringify({ claimId: "a" }))).toBeNull();
    expect(parseQrPayload("not-json")).toBeNull();
  });
});

describe("listing validation (PRD §15)", () => {
  const valid = {
    foodName: "Vegetable Biryani",
    description: "Fresh buffet biryani",
    category: "COOKED_MEALS" as const,
    totalQuantity: 60,
    unit: "PORTIONS" as const,
    preparedAt: new Date(Date.now() - 30 * 60_000),
    availableFrom: new Date(),
    pickupDeadline: new Date(Date.now() + 90 * 60_000),
    pickupAddress: "Alumni Hall, Campus",
    latitude: 12.9716,
    longitude: 77.5946,
  };

  it("accepts a valid listing", () => {
    expect(createListingSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects zero/negative quantity", () => {
    const result = createListingSchema.safeParse({ ...valid, totalQuantity: 0 });
    expect(result.success).toBe(false);
  });
  it("rejects a deadline in the past", () => {
    const result = createListingSchema.safeParse({
      ...valid,
      pickupDeadline: new Date(Date.now() - 60_000),
    });
    expect(result.success).toBe(false);
  });
  it("rejects availableFrom after pickupDeadline", () => {
    const result = createListingSchema.safeParse({
      ...valid,
      availableFrom: new Date(Date.now() + 120 * 60_000),
    });
    expect(result.success).toBe(false);
  });
  it("rejects preparedAt in the future", () => {
    const result = createListingSchema.safeParse({
      ...valid,
      preparedAt: new Date(Date.now() + 60 * 60_000),
    });
    expect(result.success).toBe(false);
  });
});

describe("sanitizeCallbackUrl (deep-link safety)", () => {
  it("accepts relative role-appropriate paths", () => {
    expect(sanitizeCallbackUrl("PROVIDER", "/provider/listings")).toBe("/provider/listings");
    expect(sanitizeCallbackUrl("RECIPIENT", "/recipient/claims")).toBe("/recipient/claims");
    expect(sanitizeCallbackUrl("ADMIN", "/admin/users")).toBe("/admin/users");
  });

  it("converts same-origin absolute URLs (withAuth default) to their path", () => {
    (globalThis as { window?: unknown }).window = { location: { origin: "http://localhost:7777" } };
    try {
      expect(sanitizeCallbackUrl("PROVIDER", "http://localhost:7777/profile")).toBe("/profile");
      expect(sanitizeCallbackUrl("ADMIN", "http://localhost:7777/admin/reports")).toBe("/admin/reports");
    } finally {
      delete (globalThis as { window?: unknown }).window;
    }
  });

  it("rejects external absolute URLs (open-redirect guard) → role home", () => {
    (globalThis as { window?: unknown }).window = { location: { origin: "http://localhost:7777" } };
    try {
      expect(sanitizeCallbackUrl("ADMIN", "https://evil.example.com/admin")).toBe("/admin");
      expect(sanitizeCallbackUrl("PROVIDER", "//evil.com")).toBe("/provider/dashboard");
    } finally {
      delete (globalThis as { window?: unknown }).window;
    }
  });

  it("never routes a user into another role's portal", () => {
    expect(sanitizeCallbackUrl("ADMIN", "/provider/listings")).toBe("/admin");
    expect(sanitizeCallbackUrl("RECIPIENT", "http://localhost:3000/provider/dashboard")).toBe("/recipient/dashboard");
  });

  it("auth pages as destination fall back to role home", () => {
    expect(sanitizeCallbackUrl("RECIPIENT", "/login")).toBe("/recipient/dashboard");
    expect(sanitizeCallbackUrl("PROVIDER", "/register")).toBe("/provider/dashboard");
  });
});
