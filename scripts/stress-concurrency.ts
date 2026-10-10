/* eslint-disable no-console */
// ---------------------------------------------------------------------------
// Concurrency stress test (PRD §22): 8 recipients race-claim against a
// 50-meal listing with total demand of 68. Run with: npx tsx scripts/stress-concurrency.ts
// Invariants: reserved + available == total, never negative, no overbooking.
// ---------------------------------------------------------------------------
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createClaim } from "../services/claim.service";

const prisma = new PrismaClient();

async function main() {
  console.log("Concurrency stress: 8 recipients race-claim against 50 meals\n");

  const passwordHash = await bcrypt.hash("Password123!", 10);
  const stamp = Date.now();
  const provider = await prisma.user.create({
    data: {
      name: "Stress Provider",
      email: `stress-p-${stamp}@test.dev`,
      phone: "+91",
      passwordHash,
      role: "PROVIDER",
      organisationName: "Stress Org",
      verificationStatus: "VERIFIED",
      latitude: 12.97,
      longitude: 77.59,
    },
  });

  const recipients = [];
  for (let i = 0; i < 8; i += 1) {
    recipients.push(
      await prisma.user.create({
        data: {
          name: `Stress Recipient ${i}`,
          email: `stress-r${i}-${stamp}@test.dev`,
          phone: "+91",
          passwordHash,
          role: "RECIPIENT",
          organisationName: `Stress Rec Org ${i}`,
          verificationStatus: "VERIFIED",
          latitude: 12.97,
          longitude: 77.59,
        },
      })
    );
  }

  const listing = await prisma.foodListing.create({
    data: {
      providerId: provider.id,
      foodName: "Stress Test Curry",
      description: "Concurrency verification listing",
      category: "COOKED_MEALS",
      totalQuantity: 50,
      availableQuantity: 50,
      unit: "PORTIONS",
      preparedAt: new Date(Date.now() - 30 * 60_000),
      availableFrom: new Date(),
      pickupDeadline: new Date(Date.now() + 2 * 60 * 60_000),
      pickupAddress: "Stress Test Point",
      latitude: 12.97,
      longitude: 77.59,
      status: "AVAILABLE",
    },
  });

  // Total demand 68 > 50 availability.
  const demands = [12, 11, 10, 9, 8, 7, 6, 5];
  const results = await Promise.allSettled(
    recipients.map((r, i) => createClaim(listing.id, r.id, demands[i]))
  );

  const succeeded = results.filter((r) => r.status === "fulfilled");
  const failed = results.filter((r) => r.status === "rejected");

  const after = await prisma.foodListing.findUniqueOrThrow({
    where: { id: listing.id },
  });
  const claims = await prisma.claim.findMany({
    where: { listingId: listing.id },
    select: { quantity: true, status: true },
  });
  const reservedSum = claims
    .filter((c) => ["RESERVED", "COLLECTED"].includes(c.status))
    .reduce((s, c) => s + c.quantity, 0);

  console.log(`  Demand raced:        ${demands.reduce((a, b) => a + b, 0)} meals`);
  console.log(`  Claims succeeded:    ${succeeded.length} (total ${reservedSum} meals)`);
  console.log(`  Claims rejected:     ${failed.length} (INSUFFICIENT_QUANTITY)`);
  console.log(`  Final availability:  ${after.availableQuantity}`);
  console.log(`  Listing status:      ${after.status}`);

  const invariantsOk =
    succeeded.length + failed.length === demands.length &&
    reservedSum + after.availableQuantity === 50 &&
    after.availableQuantity >= 0 &&
    reservedSum <= 50;

  console.log(
    invariantsOk
      ? "\n✔ Invariants hold: reserved + available == total, never negative, no overbooking"
      : "\n✘ INVARIANT VIOLATION"
  );
  process.exitCode = invariantsOk ? 0 : 1;

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
