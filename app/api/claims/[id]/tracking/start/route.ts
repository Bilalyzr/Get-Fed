import { requireRole } from "@/lib/session";
import { ok, withApi, rateLimit, clientKey, fail, ERROR_CODES } from "@/lib/api";
import { startTracking, getTrackingState } from "@/services/tracking.service";

export const dynamic = "force-dynamic";

// POST /api/claims/[claimId]/tracking/start — recipient starts/resumes (spec §6).
export const POST = withApi<{ params: { id: string } }>(async (req, { params }) => {
  const limit = rateLimit(clientKey(req, "tracking-start"), 20, 60_000);
  if (!limit.allowed) {
    return fail(ERROR_CODES.RATE_LIMITED, "Too many attempts. Wait a moment.", 429);
  }

  const user = await requireRole("RECIPIENT");
  await startTracking(params.id, user.id);
  const state = await getTrackingState(params.id, user.id, "RECIPIENT");
  return ok({ ...state, message: "Live tracking started. Share your location when prompted." });
});
