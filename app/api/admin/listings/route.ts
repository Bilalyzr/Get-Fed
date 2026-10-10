import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { ok, withApi } from "@/lib/api";

export const dynamic = "force-dynamic";

// GET /api/admin/listings — all listings for admin review (PRD §9/§43).
export const GET = withApi(async (req: Request) => {
  await requireRole("ADMIN");
  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");

  const listings = await prisma.foodListing.findMany({
    where: statusFilter ? { status: statusFilter as never } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      provider: { select: { organisationName: true, email: true } },
      _count: { select: { claims: true } },
    },
  });

  return ok(
    listings.map((l) => ({
      ...l,
      preparedAt: l.preparedAt.toISOString(),
      availableFrom: l.availableFrom.toISOString(),
      pickupDeadline: l.pickupDeadline.toISOString(),
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
      claimCount: l._count.claims,
    }))
  );
});
