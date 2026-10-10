import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppError, ERROR_CODES } from "@/lib/api";
import type { Role } from "@prisma/client";

// ---------------------------------------------------------------------------
// Server-side session helpers: every protected API derives identity from here.
// ---------------------------------------------------------------------------

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
  verificationStatus: string;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role as Role,
    verificationStatus: session.user.verificationStatus,
  };
}

/** Require any authenticated user, or throw 401 UNAUTHORIZED. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, "You must be signed in.", 401);
  }
  return user;
}

/** Require a specific role, or throw 403 FORBIDDEN. */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new AppError(
      ERROR_CODES.FORBIDDEN,
      "You do not have permission to perform this action.",
      403
    );
  }
  return user;
}

/**
 * Require a VERIFIED recipient for claiming (PRD §8/§13).
 * Reads live DB state — not the possibly-stale session token.
 */
export async function requireVerifiedRecipient(): Promise<SessionUser> {
  const user = await requireRole("RECIPIENT");
  const { prisma } = await import("@/lib/prisma");
  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: { verificationStatus: true },
  });
  if (fresh?.verificationStatus !== "VERIFIED") {
    throw new AppError(
      ERROR_CODES.RECIPIENT_NOT_VERIFIED,
      "Your organisation is not verified yet. You will be able to claim food once an administrator verifies your account.",
      403
    );
  }
  return user;
}
