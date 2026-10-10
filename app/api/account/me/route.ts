import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { ok, withApi } from "@/lib/api";

export const dynamic = "force-dynamic";

// GET /api/account/me — own account details for any authenticated role.
export const GET = withApi(async () => {
  const session = await requireUser();

  const user = await prisma.user.findUnique({
    where: { id: session.id },
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
      _count: { select: { listings: true, claims: true } },
    },
  });
  if (!user) return ok(null, 404);

  return ok({
    ...user,
    createdAt: user.createdAt.toISOString(),
    listingCount: user._count.listings,
    claimCount: user._count.claims,
  });
});
