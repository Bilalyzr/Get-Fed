import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { ok, withApi } from "@/lib/api";
import { signPayload } from "@/services/qr.service";
import { AppError, ERROR_CODES } from "@/lib/api";

export const dynamic = "force-dynamic";

// GET /api/claims/:id/qr — recipient fetches their signed QR payload (PRD §26).
// The raw claim token never leaves the DB; the response is a signed envelope.
export const GET = withApi<{ params: { id: string } }>(async (_req, { params }) => {
  const user = await requireRole("RECIPIENT");

  const claim = await prisma.claim.findUnique({
    where: { id: params.id },
    include: { listing: { select: { foodName: true, pickupDeadline: true, status: true, pickupAddress: true } } },
  });
  if (!claim) throw new AppError(ERROR_CODES.NOT_FOUND, "Claim not found.", 404);
  if (claim.recipientId !== user.id) {
    throw new AppError(ERROR_CODES.FORBIDDEN, "This is not your claim.", 403);
  }
  if (claim.status !== "RESERVED" && claim.status !== "PICKUP_IN_PROGRESS") {
    throw new AppError(
      claim.status === "COLLECTED" ? ERROR_CODES.ALREADY_COLLECTED : ERROR_CODES.INVALID_STATE,
      claim.status === "COLLECTED"
        ? "This reservation has already been collected."
        : "This claim is not active, so no QR can be shown.",
      409
    );
  }

  return ok({
    claimId: claim.id,
    signedPayload: signPayload({
      claimId: claim.id,
      listingId: claim.listingId,
      token: claim.claimToken,
    }),
    foodName: claim.listing.foodName,
    quantity: claim.quantity,
    pickupDeadline: claim.listing.pickupDeadline.toISOString(),
    pickupAddress: claim.listing.pickupAddress,
    status: claim.status,
  });
});
