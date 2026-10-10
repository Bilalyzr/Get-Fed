import { requireRole } from "@/lib/session";
import { ok, withApi } from "@/lib/api";
import { markNoShow } from "@/services/claim.service";

export const dynamic = "force-dynamic";

// POST /api/claims/:id/noshow — provider records a recipient no-show (PRD §9).
export const POST = withApi<{ params: { id: string } }>(async (_req, { params }) => {
  const user = await requireRole("PROVIDER");
  const result = await markNoShow(params.id, user.id);
  return ok({
    quantityReleased: result.quantityReleased,
    message:
      result.quantityReleased > 0
        ? `Marked as no-show. ${result.quantityReleased} returned to available quantity.`
        : "Marked as no-show. The pickup window has closed, so quantity was not restored.",
  });
});
