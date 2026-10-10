import { requireVerifiedRecipient } from "@/lib/session";
import { createClaimSchema } from "@/lib/validators";
import { ok, withApi, rateLimit, clientKey, fail, ERROR_CODES } from "@/lib/api";
import { createClaim } from "@/services/claim.service";

export const dynamic = "force-dynamic";

// POST /api/listings/:id/claims — transaction-safe partial claim (PRD §13/§20/§38).
export const POST = withApi<{ params: { id: string } }>(async (req, { params }) => {
  const limit = rateLimit(clientKey(req, "claim"), 20, 60_000);
  if (!limit.allowed) {
    return fail(ERROR_CODES.RATE_LIMITED, "Too many claim attempts. Wait a moment.", 429);
  }

  // PRD §8: only VERIFIED recipients may claim (checks live DB state).
  const recipient = await requireVerifiedRecipient();

  const body = await req.json();
  const input = createClaimSchema.parse(body);

  const result = await createClaim(params.id, recipient.id, input.quantity);

  return ok(
    {
      claimId: result.claimId,
      quantity: result.quantity,
      listingStatus: result.listingStatus,
      availableQuantity: result.availableQuantity,
      message: `Reservation confirmed for ${result.quantity}. Your QR code is ready.`,
    },
    201
  );
});
