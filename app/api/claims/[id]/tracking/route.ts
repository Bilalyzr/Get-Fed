import { requireRole } from "@/lib/session";
import { ok, withApi, rateLimit, clientKey, fail, ERROR_CODES } from "@/lib/api";
import { getTrackingState } from "@/services/tracking.service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/claims/[claimId]/tracking — recipient owner or listing provider
// only (spec §6). Coordinates are returned only for an active eligible
// session; otherwise recipientLocation is null.
export const GET = withApi<{ params: { id: string } }>(async (req, { params }) => {
  // Provider polling hits this every 5s — allow generous reads.
  const limit = rateLimit(clientKey(req, "tracking-read"), 240, 60_000);
  if (!limit.allowed) {
    return fail(ERROR_CODES.RATE_LIMITED, "Too many tracking reads.", 429);
  }

  const user = await requireRole("RECIPIENT", "PROVIDER");

  // Establish viewer relationship from live DB state.
  const claim = await prisma.claim.findUnique({
    where: { id: params.id },
    select: { recipientId: true, listing: { select: { providerId: true } } },
  });
  if (!claim) return ok(null, 404);
  const role = claim.recipientId === user.id ? "RECIPIENT" : claim.listing.providerId === user.id ? "PROVIDER" : null;
  if (!role) {
    return fail(ERROR_CODES.FORBIDDEN, "You are not part of this pickup.", 403);
  }

  const state = await getTrackingState(params.id, user.id, role);
  return ok(state);
});
