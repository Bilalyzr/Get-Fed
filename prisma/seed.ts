/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

// ---------------------------------------------------------------------------
// Development seed (PRD §53): admin, providers, verified + pending
// recipients, sample listings/claims/notifications/analytics history.
// Credentials below are DEMO ONLY — never use in production.
// ---------------------------------------------------------------------------

const prisma = new PrismaClient();

const PASSWORD = "Password123!"; // demo credential for all seeded users

// Bengaluru-area coordinates for realistic distances.
const PLACES = {
  campus: { latitude: 12.9716, longitude: 77.5946 }, // university campus
  canteen: { latitude: 12.9735, longitude: 77.591 }, // ~0.4 km
  hostel: { latitude: 12.9752, longitude: 77.5985 }, // ~0.9 km
  ngo1: { latitude: 12.968, longitude: 77.59 }, // ~0.8 km
  ngo2: { latitude: 12.9601, longitude: 77.5801 }, // ~2.6 km
  ngo3: { latitude: 12.9849, longitude: 77.6086 }, // ~3.4 km
  shelter: { latitude: 12.956, longitude: 77.6001 }, // ~2.0 km
};

async function main() {
  console.log("Seeding Get Fed development data…");

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // ------------------------------------------------------------------ users
  const admin = await prisma.user.upsert({
    where: { email: "admin@getfed.dev" },
    update: {},
    create: {
      name: "Platform Admin",
      email: "admin@getfed.dev",
      phone: "+91 90000 00001",
      passwordHash,
      role: "ADMIN",
      organisationName: "Get Fed",
      verificationStatus: "VERIFIED",
      ...PLACES.campus,
    },
  });

  const canteen = await prisma.user.upsert({
    where: { email: "canteen@college.edu" },
    update: {},
    create: {
      name: "Ravi Kumar",
      email: "canteen@college.edu",
      phone: "+91 90000 00002",
      passwordHash,
      role: "PROVIDER",
      organisationName: "Central Campus Canteen",
      verificationStatus: "VERIFIED",
      ...PLACES.canteen,
    },
  });

  const events = await prisma.user.upsert({
    where: { email: "events@college.edu" },
    update: {},
    create: {
      name: "Meera Nair",
      email: "events@college.edu",
      phone: "+91 90000 00003",
      passwordHash,
      role: "PROVIDER",
      organisationName: "College Events Team",
      verificationStatus: "VERIFIED",
      ...PLACES.campus,
    },
  });

  const hostel = await prisma.user.upsert({
    where: { email: "mess@hostel.edu" },
    update: {},
    create: {
      name: "Joseph Thomas",
      email: "mess@hostel.edu",
      phone: "+91 90000 00004",
      passwordHash,
      role: "PROVIDER",
      organisationName: "Sunrise Hostel Mess",
      verificationStatus: "VERIFIED",
      ...PLACES.hostel,
    },
  });

  const hopeKitchen = await prisma.user.upsert({
    where: { email: "hope@kitchen.org" },
    update: {},
    create: {
      name: "Anita Desai",
      email: "hope@kitchen.org",
      phone: "+91 90000 00005",
      passwordHash,
      role: "RECIPIENT",
      organisationName: "Hope Community Kitchen",
      verificationStatus: "VERIFIED",
      ...PLACES.ngo1,
    },
  });

  const greenPlate = await prisma.user.upsert({
    where: { email: "contact@greenplate.org" },
    update: {},
    create: {
      name: "Farhan Ali",
      email: "contact@greenplate.org",
      phone: "+91 90000 00006",
      passwordHash,
      role: "RECIPIENT",
      organisationName: "Green Plate Initiative",
      verificationStatus: "VERIFIED",
      ...PLACES.ngo2,
    },
  });

  const annaShelter = await prisma.user.upsert({
    where: { email: "hello@annashelter.org" },
    update: {},
    create: {
      name: "Lakshmi Rao",
      email: "hello@annashelter.org",
      phone: "+91 90000 00007",
      passwordHash,
      role: "RECIPIENT",
      organisationName: "Anna Shelter",
      verificationStatus: "VERIFIED",
      ...PLACES.shelter,
    },
  });

  const pendingRecipient = await prisma.user.upsert({
    where: { email: "new@ngo.org" },
    update: { verificationStatus: "PENDING" },
    create: {
      name: "Sam Verma",
      email: "new@ngo.org",
      phone: "+91 90000 00008",
      passwordHash,
      role: "RECIPIENT",
      organisationName: "New Beginnings NGO",
      verificationStatus: "PENDING",
      ...PLACES.ngo3,
    },
  });

  // Recipient preferences (PRD §36)
  for (const [user, pref] of [
    [hopeKitchen, { maxDistanceKm: 5, minimumQuantity: 10, maximumQuantity: 100 }],
    [greenPlate, { maxDistanceKm: 8, minimumQuantity: 20, maximumQuantity: 150 }],
    [annaShelter, { maxDistanceKm: 10, minimumQuantity: 5, maximumQuantity: 80 }],
  ] as const) {
    await prisma.recipientPreference.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, ...pref },
    });
  }

  // ------------------------------------------------------------------ listings
  const now = Date.now();
  const minutes = (n: number) => new Date(now + n * 60_000);
  const daysAgo = (n: number) => new Date(now - n * 24 * 60 * 60_000);

  // Active listings
  const biryani = await prisma.foodListing.create({
    data: {
      providerId: events.id,
      foodName: "Vegetable Biryani",
      description:
        "Fresh vegetarian biryani from the alumni meet buffet. Cooked this afternoon, packed in hygienic individual containers.",
      category: "COOKED_MEALS",
      totalQuantity: 60,
      availableQuantity: 60,
      unit: "PORTIONS",
      preparedAt: new Date(now - 45 * 60_000),
      availableFrom: new Date(now - 30 * 60_000),
      pickupDeadline: minutes(90),
      pickupAddress: "Alumni Hall, University Campus, Bengaluru",
      latitude: PLACES.campus.latitude,
      longitude: PLACES.campus.longitude,
      allergenNotes: "Contains dairy (ghee)",
      packagingType: "Individual sealed boxes",
      notes: "Please bring carry bags; ask for the events desk at the entrance.",
      status: "AVAILABLE",
    },
  });

  const sandwiches = await prisma.foodListing.create({
    data: {
      providerId: canteen.id,
      foodName: "Paneer Sandwiches",
      description:
        "Unopened sandwich platters from today's lunch service. Suitable for immediate consumption.",
      category: "PACKAGED",
      totalQuantity: 40,
      availableQuantity: 40,
      unit: "PORTIONS",
      preparedAt: new Date(now - 2 * 60 * 60_000),
      availableFrom: new Date(now - 60 * 60_000),
      pickupDeadline: minutes(150),
      pickupAddress: "Central Canteen, Block A, University Campus",
      latitude: PLACES.canteen.latitude,
      longitude: PLACES.canteen.longitude,
      packagingType: "Cling-wrapped platters",
      status: "AVAILABLE",
    },
  });

  const bread = await prisma.foodListing.create({
    data: {
      providerId: hostel.id,
      foodName: "Fresh Bread & Buns",
      description: "Over-ordered bakery stock for today's breakfast. Still soft and sealed.",
      category: "BAKERY",
      totalQuantity: 25,
      availableQuantity: 25,
      unit: "PACKETS",
      preparedAt: new Date(now - 5 * 60 * 60_000),
      availableFrom: new Date(now - 30 * 60_000),
      pickupDeadline: minutes(240),
      pickupAddress: "Sunrise Hostel Mess, North Gate",
      latitude: PLACES.hostel.latitude,
      longitude: PLACES.hostel.longitude,
      status: "AVAILABLE",
    },
  });

  // Historic listings for analytics depth (past 2 weeks)
  const historySpecs = [
    { provider: canteen, name: "Dal & Rice Meals", qty: 50, days: 1, collected: 45, food: "COOKED_MEALS" },
    { provider: canteen, name: "Idli Batch", qty: 80, days: 2, collected: 72, food: "COOKED_MEALS" },
    { provider: events, name: "Symposium Snack Boxes", qty: 120, days: 3, collected: 96, food: "PACKAGED" },
    { provider: hostel, name: "Chapati & Curry", qty: 60, days: 4, collected: 30, food: "COOKED_MEALS" },
    { provider: canteen, name: "Mixed Vegetable Curry", qty: 35, days: 6, collected: 35, food: "COOKED_MEALS" },
    { provider: events, name: "Cultural Fest Dinner", qty: 200, days: 8, collected: 160, food: "COOKED_MEALS" },
    { provider: hostel, name: "Breakfast Extras", qty: 45, days: 10, collected: 20, food: "PACKAGED" },
    { provider: canteen, name: "Soup of the Day", qty: 30, days: 12, collected: 24, food: "COOKED_MEALS" },
    { provider: events, name: "Workshop Lunch", qty: 90, days: 13, collected: 78, food: "COOKED_MEALS" },
  ] as const;

  for (const spec of historySpecs) {
    const createdAt = daysAgo(spec.days);
    const deadline = new Date(createdAt.getTime() + 3 * 60 * 60_000);
    const uncollected = spec.qty - spec.collected;

    // Split historical collection between the verified recipients.
    const collectors = [hopeKitchen, greenPlate, annaShelter];
    let remaining = spec.collected;
    const allocations = collectors.map((c, i) => {
      const share =
        i === collectors.length - 1 ? remaining : Math.round(spec.collected / collectors.length);
      remaining -= share;
      return { recipient: c, share };
    });

    await prisma.foodListing.create({
      data: {
        providerId: spec.provider.id,
        foodName: spec.name,
        description: `Historical seeded listing (${spec.days} days ago) for analytics.`,
        category: spec.food,
        totalQuantity: spec.qty,
        availableQuantity: 0,
        unit: "PORTIONS",
        preparedAt: createdAt,
        availableFrom: createdAt,
        pickupDeadline: deadline,
        pickupAddress: "Historical pickup point",
        latitude: PLACES.campus.latitude,
        longitude: PLACES.campus.longitude,
        status: uncollected > 0 ? "EXPIRED" : "COLLECTED",
        claims: {
          create: allocations
            .filter((a) => a.share > 0)
            .map((a) => ({
              recipientId: a.recipient.id,
              quantity: a.share,
              status: "COLLECTED" as const,
              claimToken: randomBytes(32).toString("base64url"),
              claimedAt: createdAt,
              collectedAt: new Date(deadline.getTime() - 20 * 60_000),
            })),
        },
      },
    });
  }

  // ------------------------------------------------------------------ active claim demo
  // Hope Kitchen already reserved 20 of the sandwich platters.
  await prisma.claim.create({
    data: {
      listingId: sandwiches.id,
      recipientId: hopeKitchen.id,
      quantity: 20,
      status: "RESERVED",
      claimToken: randomBytes(32).toString("base64url"),
    },
  });
  await prisma.foodListing.update({
    where: { id: sandwiches.id },
    data: { availableQuantity: 20, status: "PARTIALLY_RESERVED" },
  });

  // ------------------------------------------------------------------ notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: hopeKitchen.id,
        title: "New food nearby",
        message: "Vegetable Biryani: 60 portions available 0.9 km away. Pickup soon — check the deadline.",
        type: "NEW_LISTING_NEARBY",
      },
      {
        userId: canteen.id,
        title: "New claim received",
        message: "Hope Community Kitchen reserved 20 of 40 portions of Paneer Sandwiches.",
        type: "NEW_CLAIM",
      },
      {
        userId: admin.id,
        title: "Recipient awaiting verification",
        message: "New Beginnings NGO registered and needs verification.",
        type: "SYSTEM",
      },
    ],
  });

  // ------------------------------------------------------------------ audit trail
  await prisma.auditLog.createMany({
    data: [
      {
        action: "FOOD_LISTING_CREATED",
        entityType: "FoodListing",
        entityId: biryani.id,
        userId: events.id,
        metadata: { foodName: "Vegetable Biryani", totalQuantity: 60 },
      },
      {
        action: "CLAIM_CREATED",
        entityType: "Claim",
        userId: hopeKitchen.id,
        metadata: { listingId: sandwiches.id, quantity: 20 },
      },
      {
        action: "USER_VERIFIED",
        entityType: "User",
        userId: admin.id,
        metadata: { target: hopeKitchen.email, status: "VERIFIED" },
      },
    ],
  });

  console.log("Seed complete.");
  console.log("Demo accounts (password for all: Password123!):");
  console.log("  ADMIN     admin@getfed.dev");
  console.log("  PROVIDER  canteen@college.edu / events@college.edu / mess@hostel.edu");
  console.log("  RECIPIENT hope@kitchen.org (verified)");
  console.log("             contact@greenplate.org (verified)");
  console.log("             hello@annashelter.org (verified)");
  console.log("             new@ngo.org (PENDING — for verification demo)");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
