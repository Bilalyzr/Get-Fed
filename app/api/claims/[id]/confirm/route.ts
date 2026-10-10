import { requireRole } from "@/lib/session";
import { qrVerifySchema } from "@/lib/validators";
import { ok, withApi, rateLimit, clientKey, fail, ERROR_CODES, AppError } from "@/lib/api";
import { confirmCollectionByQr } from "@/services/claim.service";
import { verifySignedPayload } from "@/services/qr.service";

export const dynamic = "force-dynamic";

// POST /api/claims/:id/confirm — QR-verified collection (PRD §27/§28/§38).
// The provider's scanner posts the signed QR envelope; the HMAC, the URL id,
// and the claim token are all verified server-side before anything is marked
// COLLECTED. Client-side validation is never trusted.
export const POST = withApi<{ params: { id: string } }>(async (req, { params }) => {
  const limit = rateLimit(clientKey(req, "qr-confirm"), 30, 60_000);
  if (!limit.allowed) {
    return fail(ERROR_CODES.RATE_LIMITED, "Too many scan attempts. Wait a moment.", 429);
  }

  const user = await requireRole("PROVIDER");

  const body = await req.json();
  const input = qrVerifySchema.parse(body);

  const decoded = verifySignedPayload(input.payload);
  if (!decoded || decoded.claimId !== params.id) {
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
