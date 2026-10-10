import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { recipientPreferenceSchema } from "@/lib/validators";
import { ok, withApi } from "@/lib/api";

export const dynamic = "force-dynamic";

// GET /api/recipient/profile — profile + preferences (PRD §36/§38).
export const GET = withApi(async () => {
  const user = await requireRole("RECIPIENT", "PROVIDER", "ADMIN");

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      organisationName: true,
      verificationStatus: true,
      latitude: true,
      longitude: true,
      createdAt: true,
    },
  });

  let preference = null;
  if (user.role === "RECIPIENT") {
    preference =
      (await prisma.recipientPreference.findUnique({ where: { userId: user.id } })) ??
      (await prisma.recipientPreference.create({ data: { userId: user.id } }));
  }

  return ok({
    profile: profile
      ? { ...profile, createdAt: profile.createdAt.toISOString() }
      : null,
    preference,
  });
});

// PATCH /api/recipient/profile — update location and matching preferences.
export const PATCH = withApi(async (req: Request) => {
  const user = await requireRole("RECIPIENT");

  const body = await req.json();
  const { latitude, longitude, preferences } = body as {
    latitude?: number;
    longitude?: number;
    preferences?: Record<string, unknown>;
  };

  if (latitude != null || longitude != null) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(latitude != null ? { latitude } : {}),
        ...(longitude != null ? { longitude } : {}),
      },
    });
  }

  let preference = null;
  if (preferences) {
    const parsed = recipientPreferenceSchema.parse(preferences);
    preference = await prisma.recipientPreference.upsert({
      where: { userId: user.id },
      update: {
        maxDistanceKm: parsed.maxDistanceKm,
        minimumQuantity: parsed.minimumQuantity,
        maximumQuantity: parsed.maximumQuantity,
        availableFrom: parsed.availableFrom || null,
        availableUntil: parsed.availableUntil || null,
      },
      create: {
        userId: user.id,
        maxDistanceKm: parsed.maxDistanceKm,
        minimumQuantity: parsed.minimumQuantity,
        maximumQuantity: parsed.maximumQuantity,
        availableFrom: parsed.availableFrom || null,
        availableUntil: parsed.availableUntil || null,
      },
    });
  }

  return ok({ preference, message: "Profile updated." });
});
