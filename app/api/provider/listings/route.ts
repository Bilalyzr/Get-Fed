import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { ok, withApi } from "@/lib/api";

export const dynamic = "force-dynamic";

// GET /api/provider/listings — provider's own listings with claim counts.
export const GET = withApi(async () => {
  const user = await requireRole("PROVIDER");

  const listings = await prisma.foodListing.findMany({
    where: { providerId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { _count: { select: { claims: true } } },
  });

  return ok({
    listings: listings.map((l) => ({
      ...l,
      preparedAt: l.preparedAt.toISOString(),
      availableFrom: l.availableFrom.toISOString(),
      pickupDeadline: l.pickupDeadline.toISOString(),
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
      claimCount: l._count.claims,
    })),
  });
});
