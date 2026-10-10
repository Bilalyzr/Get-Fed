import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { ok, withApi, AppError, ERROR_CODES } from "@/lib/api";

export const dynamic = "force-dynamic";

// GET /api/provider/listings/:id/claims — claims for one of my listings.
export const GET = withApi<{ params: { id: string } }>(async (_req, { params }) => {
  const user = await requireRole("PROVIDER");

  const listing = await prisma.foodListing.findUnique({
    where: { id: params.id },
    select: { providerId: true },
  });
  if (!listing) throw new AppError(ERROR_CODES.NOT_FOUND, "Listing not found.", 404);
  if (listing.providerId !== user.id) {
    throw new AppError(ERROR_CODES.FORBIDDEN, "This is not your listing.", 403);
  }

  const claims = await prisma.claim.findMany({
    where: { listingId: params.id },
    orderBy: { createdAt: "desc" },
    include: { recipient: { select: { organisationName: true, name: true } } },
  });

  return ok(
    claims.map((c) => ({
      id: c.id,
      quantity: c.quantity,
      status: c.status,
      recipientOrg: c.recipient.organisationName,
      recipientName: c.recipient.name,
      createdAt: c.createdAt.toISOString(),
      collectedAt: c.collectedAt?.toISOString() ?? null,
    }))
  );
});
