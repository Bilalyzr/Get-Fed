import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { ok, withApi } from "@/lib/api";

export const dynamic = "force-dynamic";

// GET /api/claims/me — recipient's claims with listing context (PRD §38).
export const GET = withApi(async (req: Request) => {
  const user = await requireRole("RECIPIENT");
  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");

  const claims = await prisma.claim.findMany({
    where: {
      recipientId: user.id,
      ...(statusFilter === "active"
        ? { status: { in: ["RESERVED", "PICKUP_IN_PROGRESS"] } }
        : statusFilter === "past"
        ? { status: { in: ["COLLECTED", "CANCELLED", "NO_SHOW", "EXPIRED"] } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          foodName: true,
          unit: true,
          pickupDeadline: true,
          pickupAddress: true,
          status: true,
          latitude: true,
          longitude: true,
          provider: { select: { organisationName: true } },
        },
      },
    },
  });

  const now = Date.now();
  return ok(
    claims.map((c) => ({
      id: c.id,
      quantity: c.quantity,
      status: c.status,
      claimedAt: c.claimedAt.toISOString(),
      cancelledAt: c.cancelledAt?.toISOString() ?? null,
      collectedAt: c.collectedAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      listing: {
        ...c.listing,
        pickupDeadline: c.listing.pickupDeadline.toISOString(),
        expired: c.listing.pickupDeadline.getTime() <= now,
      },
    }))
  );
});
