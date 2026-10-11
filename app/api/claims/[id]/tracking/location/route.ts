import { requireRole } from "@/lib/session";
import { ok, withApi, rateLimit, clientKey, fail, ERROR_CODES, AppError } from "@/lib/api";
import { submitLocation } from "@/services/tracking.service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().min(0).max(5000),
  headingDegrees: z.number().min(0).max(360).nullable().optional(),
  speedMps: z.number().min(0).max(100).nullable().optional(),
  clientTimestamp: z.coerce.date(),
});

// POST /api/claims/[claimId]/tracking/location — validated fix ingestion (spec §6).
export const POST = withApi<{ params: { id: string } }>(async (req, { params }) => {
  // 5-second client cadence → 12/min; allow headroom for retries.
  const limit = rateLimit(clientKey(req, "tracking-loc"), 60, 60_000);
  if (!limit.allowed) {
    return fail(ERROR_CODES.RATE_LIMITED, "Location update rate exceeded.", 429);
  }

  const user = await requireRole("RECIPIENT");

  const raw = await req.text();
  if (raw.length > 2048) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Payload too large.", 413);
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Malformed JSON body.", 400);
  }

  const input = locationSchema.parse(body);
  const state = await submitLocation(params.id, user.id, input);
  return ok(state);
});
