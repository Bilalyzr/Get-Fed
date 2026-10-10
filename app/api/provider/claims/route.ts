import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { ok, withApi } from "@/lib/api";

export const dynamic = "force-dynamic";

// GET /api/provider/claims — claims against a provider's listings (PRD §41).
// Recipient personal contact details are never exposed (PRD §48) — only the
// organisation name.
export const GET = withApi(async (req: Request) => {
  const user = await requireRole("PROVIDER");
  const url = new URL(req.url);
  const filter = url.searchParams.get("filter");

  const now = new Date();
  const claims = await prisma.claim.findMany({
    where: {
      listing: { providerId: user.id },
      ...(filter === "active"
        ? { status: { in: ["RESERVED", "PICKUP_IN_PROGRESS"] } }
        : filter === "completed"
        ? { status: { in: ["COLLECTED", "CANCELLED", "NO_SHOW", "EXPIRED"] } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      listing: {
        select: { foodName: true, unit: true, pickupDeadline: true, status: true, id: true },
      },
      recipient: { select: { organisationName: true, name: true } },
    },
  });

  return ok(
    claims.map((c) => ({
      id: c.id,
      listingId: c.listing.id,
      quantity: c.quantity,
      status: c.status,
      foodName: c.listing.foodName,
      unit: c.listing.unit,
      recipientOrg: c.recipient.organisationName,
      recipientName: c.recipient.name,
      createdAt: c.createdAt.toISOString(),
      pickupDeadline: c.listing.pickupDeadline.toISOString(),
      collectedAt: c.collectedAt?.toISOString() ?? null,
      expired: c.listing.pickupDeadline.getTime() <= now.getTime(),
    }))
  );
});
