import { requireRole } from "@/lib/session";
import { ok, withApi } from "@/lib/api";
import { startPickup } from "@/services/claim.service";

export const dynamic = "force-dynamic";

// POST /api/claims/:id/pickup — recipient signals en route (PRD §38).
export const POST = withApi<{ params: { id: string } }>(async (_req, { params }) => {
  const user = await requireRole("RECIPIENT");
  const result = await startPickup(params.id, user.id);
  return ok({ status: result.status, message: "Provider notified — safe travels!" });
});
