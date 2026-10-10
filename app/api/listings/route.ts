import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/session";
import { createListingSchema, discoverQuerySchema } from "@/lib/validators";
import { ok, withApi, rateLimit, clientKey, fail, ERROR_CODES } from "@/lib/api";
import { createListing } from "@/services/listing.service";
import { discoverListings } from "@/services/discovery.service";
import { notifyMatchesForListing } from "@/services/matching.service";

export const dynamic = "force-dynamic";

// GET /api/listings — recipient discovery with server-side filters (PRD §38/§49).
// Public authenticated listing browse: providers see their own, recipients see
// the discovery feed, admins see all active.
export const GET = withApi(async (req: Request) => {
  const url = new URL(req.url);
  const query = discoverQuerySchema.parse(Object.fromEntries(url.searchParams));

  const user = await requireUser();
  if (user.role === "ADMIN") {
    const all = await prisma.foodListing.findMany({
      where: { status: { in: ["AVAILABLE", "PARTIALLY_RESERVED"] } },
      orderBy: { pickupDeadline: "asc" },
      take: 50,
      include: { provider: { select: { organisationName: true } } },
    });
    return ok({
      items: all.map((row) => ({
        ...row,
        preparedAt: row.preparedAt.toISOString(),
        availableFrom: row.availableFrom.toISOString(),
        pickupDeadline: row.pickupDeadline.toISOString(),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        distanceKm: null,
        providerOrganisation: row.provider.organisationName,
      })),
      total: all.length,
      page: 1,
      pageSize: 50,
    });
  }

  const result = await discoverListings(query);
  return ok(result);
});

// POST /api/listings — provider creates a listing (PRD §38).
export const POST = withApi(async (req: Request) => {
  const limit = rateLimit(clientKey(req, "create-listing"), 20, 60_000);
  if (!limit.allowed) {
    return fail(ERROR_CODES.RATE_LIMITED, "Too many listing creations. Wait a minute.", 429);
  }

  const user = await requireRole("PROVIDER");

  const body = await req.json();
  const input = createListingSchema.parse(body);

  const listing = await createListing(user.id, input);

  // Fire-and-forget matching notifications (PRD §22 flow step 9).
  const created = await prisma.foodListing.findUnique({
    where: { id: listing.id },
  });
  if (created) {
    void notifyMatchesForListing(created).catch((err) =>
      console.error("[matching] notification failed:", err)
    );
  }

  return ok({ listing, message: "Listing published successfully." }, 201);
});
