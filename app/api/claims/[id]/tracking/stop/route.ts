import { requireRole } from "@/lib/session";
import { ok, withApi } from "@/lib/api";
import { stopTracking } from "@/services/tracking.service";

export const dynamic = "force-dynamic";

// POST /api/claims/[claimId]/tracking/stop — recipient withdraws consent (spec §6).
// Live coordinates are cleared immediately (retention policy).
export const POST = withApi<{ params: { id: string } }>(async (_req, { params }) => {
  const user = await requireRole("RECIPIENT");
  const session = await stopTracking(params.id, user.id);
  return ok({
    stopped: !!session,
    message: "Live sharing stopped and your location data was cleared.",
  });
});
