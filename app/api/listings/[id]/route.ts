import { prisma } from "@/lib/prisma";
import { requireUser, requireRole } from "@/lib/session";
import { updateListingSchema } from "@/lib/validators";
import { ok, withApi } from "@/lib/api";
import { getListing, updateListing } from "@/services/listing.service";
import { haversineDistanceKm } from "@/lib/distance";

export const dynamic = "force-dynamic";

// GET /api/listings/:id — single listing (PRD §38).
// Recipients may only see discoverable listings; providers see their own
// regardless of status; admins see everything.
export const GET = withApi<{ params: { id: string } }>(async (_req, { params }) => {
  const user = await requireUser();
  const listing = await getListing(params.id);
  if (!listing) {
    return ok(null, 404);
  }

  const isOwner = listing.providerId === user.id;
  const isAdmin = user.role === "ADMIN";
  const isDiscoverable = ["AVAILABLE", "PARTIALLY_RESERVED"].includes(listing.status);
  const hasActiveClaim = await prisma.claim.findFirst({
    where: { listingId: listing.id, recipientId: user.id, status: { in: ["RESERVED", "PICKUP_IN_PROGRESS", "COLLECTED"] } },
    select: { id: true },
  });

  if (!isOwner && !isAdmin && !isDiscoverable && !hasActiveClaim) {
    return ok(null, 404);
  }

  const provider = await prisma.user.findUnique({
    where: { id: listing.providerId },
    select: { organisationName: true, latitude: true, longitude: true },
  });

  const url = new URL(_req.url);
  const lat = Number(url.searchParams.get("latitude"));
  const lng = Number(url.searchParams.get("longitude"));
  const distanceKm =
    Number.isFinite(lat) && Number.isFinite(lng) && provider
      ? Math.round(
          haversineDistanceKm(
            { latitude: lat, longitude: lng },
            { latitude: listing.latitude, longitude: listing.longitude }
          ) * 10
        ) / 10
      : null;

  // Recipients never see the provider's private contact details (PRD §48).
  const myClaim = hasActiveClaim
    ? await prisma.claim.findFirst({
        where: { listingId: listing.id, recipientId: user.id, status: { in: ["RESERVED", "PICKUP_IN_PROGRESS", "COLLECTED"] } },
        select: { id: true, quantity: true, status: true },
      })
    : null;

  const claimCount = await prisma.claim.count({ where: { listingId: listing.id } });

  return ok({
    listing: {
      ...listing,
      preparedAt: listing.preparedAt.toISOString(),
      availableFrom: listing.availableFrom.toISOString(),
      pickupDeadline: listing.pickupDeadline.toISOString(),
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
    },
    providerOrganisation: provider?.organisationName ?? "Unknown provider",
    distanceKm,
    myClaim,
    claimCount,
  });
});

// PATCH /api/listings/:id — provider edits own listing (PRD §38/§47).
export const PATCH = withApi<{ params: { id: string } }>(async (req, { params }) => {
  const user = await requireRole("PROVIDER");
  const body = await req.json();
  const input = updateListingSchema.parse(body);
  const listing = await updateListing(params.id, user.id, input);
  return ok({ listing, message: "Listing updated." });
});
