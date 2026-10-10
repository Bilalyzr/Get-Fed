import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { ok, withApi, AppError, ERROR_CODES, rateLimit, clientKey, fail } from "@/lib/api";
import { audit, AUDIT_ACTIONS } from "@/lib/audit";
import { z } from "zod";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(72, "New password must be at most 72 characters"),
});

// POST /api/account/password — change own password (any role).
// Verifies the current password server-side; never trusts client state.
export const POST = withApi(async (req: Request) => {
  const limit = rateLimit(clientKey(req, "password-change"), 5, 60_000);
  if (!limit.allowed) {
    return fail(ERROR_CODES.RATE_LIMITED, "Too many attempts. Try again shortly.", 429);
  }

  const user = await requireUser();
  const body = await req.json();
  const input = passwordChangeSchema.parse(body);

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!record) {
    throw new AppError(ERROR_CODES.NOT_FOUND, "Account not found.", 404);
  }

  const valid = await bcrypt.compare(input.currentPassword, record.passwordHash);
  if (!valid) {
    throw new AppError(
      ERROR_CODES.UNAUTHORIZED,
      "Your current password is incorrect.",
      401
    );
  }

  const sameAsOld = await bcrypt.compare(input.newPassword, record.passwordHash);
  if (sameAsOld) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      "The new password must be different from the current one.",
      422
    );
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  await audit(prisma, AUDIT_ACTIONS.PASSWORD_CHANGED, "User", user.id, user.id, {
    role: user.role,
  });

  return ok({ message: "Password updated. Use your new password next time you sign in." });
});
