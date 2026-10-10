import { NextResponse } from "next/server";
import { ZodError } from "zod";

// ---------------------------------------------------------------------------
// Standardized error codes (PRD §84)
// ---------------------------------------------------------------------------

export const ERROR_CODES = {
  LISTING_EXPIRED: "LISTING_EXPIRED",
  CLAIM_CANCELLED: "CLAIM_CANCELLED",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  RECIPIENT_NOT_VERIFIED: "RECIPIENT_NOT_VERIFIED",
  INVALID_TOKEN: "INVALID_TOKEN",
  ALREADY_COLLECTED: "ALREADY_COLLECTED",
  INSUFFICIENT_QUANTITY: "INSUFFICIENT_QUANTITY",
  INVALID_STATE: "INVALID_STATE",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SELF_CLAIM: "SELF_CLAIM",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// ---------------------------------------------------------------------------
// Response helpers — consistent { success, data } / { success, code, message }
// ---------------------------------------------------------------------------

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(
  code: ErrorCode,
  message: string,
  status = 400
): NextResponse {
  return NextResponse.json({ success: false, code, message }, { status });
}

/**
 * Application-level error with a stable machine code + friendly message.
 * Thrown by services; caught by the withApi wrapper below.
 */
export class AppError extends Error {
  code: ErrorCode;
  status: number;

  constructor(code: ErrorCode, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// API wrapper: uniform error handling + sanitized responses
// ---------------------------------------------------------------------------

type Handler<Ctx> = (req: Request, ctx: Ctx) => Promise<NextResponse>;

export function withApi<Ctx = unknown>(handler: Handler<Ctx>): Handler<Ctx> {
  return async (req: Request, ctx: Ctx): Promise<NextResponse> => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      if (error instanceof AppError) {
        return fail(error.code, error.message, error.status);
      }
      if (error instanceof ZodError) {
        const first = error.errors[0];
        return fail(
          ERROR_CODES.VALIDATION_ERROR,
          first
            ? `${first.path.join(".") || "input"}: ${first.message}`
            : "Invalid request data.",
          422
        );
      }
      // Never leak raw internal errors to clients.
      console.error("[api] unhandled error:", error);
      return fail(
        ERROR_CODES.INTERNAL_ERROR,
        "Something went wrong. Please try again.",
        500
      );
    }
  };
}

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter (per-IP, fixed window).
// Best-effort for an MVP single-instance deployment.
// ---------------------------------------------------------------------------

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  bucket.count += 1;
  if (bucket.count > limit) return { allowed: false, remaining: 0 };
  return { allowed: true, remaining: limit - bucket.count };
}

export function clientKey(req: Request, scope: string): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";
  return `${scope}:${ip}`;
}
