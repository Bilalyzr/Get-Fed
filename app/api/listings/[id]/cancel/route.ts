import { requireRole } from "@/lib/session";
import { ok, withApi } from "@/lib/api";
import { cancelListing } from "@/services/listing.service";

export const dynamic = "force-dynamic";

// POST /api/listings/:id/cancel — provider cancels listing (PRD §16/§38).
// Cancels outstanding claims, notifies recipients, writes audit logs.
export const POST = withApi<{ params: { id: string } }>(async (_req, { params }) => {
  const user = await requireRole("PROVIDER");
  const listing = await cancelListing(params.id, user.id);
  return ok({ listing, message: "Listing cancelled. Affected recipients were notified." });
});
