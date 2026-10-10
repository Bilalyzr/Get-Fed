import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { ok, withApi } from "@/lib/api";

export const dynamic = "force-dynamic";

// GET /api/admin/claims — all claims for admin review (PRD §9/§43).
export const GET = withApi(async (req: Request) => {
  await requireRole("ADMIN");
  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");

  const claims = await prisma.claim.findMany({
    where: statusFilter ? { status: statusFilter as never } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      listing: { select: { foodName: true, unit: true, status: true, pickupDeadline: true } },
      recipient: { select: { name: true, organisationName: true, verificationStatus: true } },
    },
  });

  return ok(
    claims.map((c) => ({
      ...c,
      claimedAt: c.claimedAt.toISOString(),
      cancelledAt: c.cancelledAt?.toISOString() ?? null,
      collectedAt: c.collectedAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      listing: {
        ...c.listing,
        pickupDeadline: c.listing.pickupDeadline.toISOString(),
      },
    }))
  );
});
