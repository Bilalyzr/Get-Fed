import { requireRole } from "@/lib/session";
import { ok, withApi } from "@/lib/api";
import { cancelClaim } from "@/services/claim.service";

export const dynamic = "force-dynamic";

// POST /api/claims/:id/cancel — recipient cancels (PRD §15/§24/§38).
// Restores quantity only when the pickup deadline has not passed.
export const POST = withApi<{ params: { id: string } }>(async (_req, { params }) => {
  const user = await requireRole("RECIPIENT");
  const result = await cancelClaim(params.id, user.id);
  return ok({
    restored: result.restored,
    listingAvailable: result.listingAvailable,
    message: result.restored
      ? "Your claim was cancelled and the quantity is available to others again."
      : "Your claim was cancelled. The pickup window had already closed, so quantity was not restored.",
  });
});
