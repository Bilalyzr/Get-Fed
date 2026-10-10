import crypto from "crypto";

// ---------------------------------------------------------------------------
// Secure QR claim tokens (PRD §26/§28/§81).
//
// Security model:
//   1. Each claim gets a 256-bit cryptographically-secure random token
//      (claimToken column, unique index, never exposed except inside the QR).
//   2. The QR payload contains claimId + listingId + token. A scan that
//      presents the wrong token for a claim is rejected (INVALID_TOKEN).
//   3. Verification is 100% server-side; double scans hit a status guard
//      (ALREADY_COLLECTED).
//   4. An HMAC signature binds the payload so tokens cannot be forged from
//      a claim ID alone even if AUTH_SECRET rotates independently.
// ---------------------------------------------------------------------------

function authSecret(): string {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "fws-dev-secret";
}

export type QrPayload = {
  claimId: string;
  listingId: string;
  token: string;
};

export function generateClaimToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function encodeQrPayload(payload: QrPayload): string {
  return JSON.stringify(payload);
}

/** Parse a scanned QR string into a validated payload shape. */
export function parseQrPayload(raw: string): QrPayload | null {
  try {
    const parsed = JSON.parse(raw) as Partial<QrPayload>;
    if (
      typeof parsed.claimId === "string" &&
      typeof parsed.listingId === "string" &&
      typeof parsed.token === "string" &&
      parsed.claimId.length > 0 &&
      parsed.token.length >= 10
    ) {
      return {
        claimId: parsed.claimId,
        listingId: parsed.listingId,
        token: parsed.token,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Constant-time comparison between the presented token and the stored token,
 * so scanning cannot leak token contents through timing.
 */
export function tokenMatches(presented: string, stored: string): boolean {
  const a = Buffer.from(presented);
  const b = Buffer.from(stored);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// -------------------------- HMAC payload signature ---------------------------

function sign(body: string): string {
  return crypto.createHmac("sha256", authSecret()).update(body).digest("base64url");
}

export function signPayload(payload: QrPayload): string {
  const body = encodeQrPayload(payload);
  return `${Buffer.from(body).toString("base64url")}.${sign(body)}`;
}

export function verifySignedPayload(signed: string): QrPayload | null {
  const dot = signed.lastIndexOf(".");
  if (dot <= 0) return null;
  const bodyB64 = signed.slice(0, dot);
  const signature = signed.slice(dot + 1);
  let body: string;
  try {
    body = Buffer.from(bodyB64, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expected = sign(body);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  return parseQrPayload(body);
}
