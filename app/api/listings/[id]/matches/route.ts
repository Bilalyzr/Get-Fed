import { requireRole } from "@/lib/session";
import { ok, withApi } from "@/lib/api";
import { getListing } from "@/services/listing.service";
import { computeMatchesForListing } from "@/services/matching.service";

export const dynamic = "force-dynamic";

// GET /api/listings/:id/matches — ranked recipient matches (PRD §38/§62).
// Only the listing's provider (or an admin) may inspect matches.
export const GET = withApi<{ params: { id: string } }>(async (_req, { params }) => {
  const user = await requireRole("PROVIDER", "ADMIN");
  const listing = await getListing(params.id);
  if (!listing) return ok([], 404);
  if (user.role === "PROVIDER" && listing.providerId !== user.id) {
    return ok({ error: "FORBIDDEN" }, 403);
  }

  const matches = await computeMatchesForListing(listing);
  return ok(matches);
});
