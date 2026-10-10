import { requireRole } from "@/lib/session";
import { qrVerifySchema } from "@/lib/validators";
import { ok, withApi, rateLimit, clientKey, fail, ERROR_CODES, AppError } from "@/lib/api";
import { confirmCollectionByQr } from "@/services/claim.service";
import { verifySignedPayload } from "@/services/qr.service";

export const dynamic = "force-dynamic";

// POST /api/claims/scan/verify — provider scanner endpoint (PRD §27).
// Accepts the signed QR envelope; verifies HMAC + claim token server-side.
export const POST = withApi(async (req: Request) => {
  const limit = rateLimit(clientKey(req, "qr-confirm"), 30, 60_000);
  if (!limit.allowed) {
    return fail(ERROR_CODES.RATE_LIMITED, "Too many scan attempts. Wait a moment.", 429);
  }

  const user = await requireRole("PROVIDER");

  const body = await req.json();
  const input = qrVerifySchema.parse(body);

  const decoded = verifySignedPayload(input.payload);
  if (!decoded) {
    throw new AppError(ERROR_CODES.INVALID_TOKEN, "Invalid QR code.", 401);
  }

  const result = await confirmCollectionByQr(user.id, decoded.claimId, decoded.token);

  return ok({
    claimId: result.claimId,
    quantity: result.quantity,
    foodName: result.foodName,
    unit: result.unit,
    message: `Pickup successful — ${result.quantity} ${result.unit.toLowerCase()} of "${result.foodName}" verified and recorded.`,
  });
});
