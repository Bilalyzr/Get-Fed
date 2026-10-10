import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { ok, fail, ERROR_CODES, withApi, rateLimit, clientKey } from "@/lib/api";
import { audit, AUDIT_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

// POST /api/auth/register (PRD §38, FR-01)
export const POST = withApi(async (req: Request) => {
  const limit = rateLimit(clientKey(req, "register"), 10, 60_000);
  if (!limit.allowed) {
    return fail(ERROR_CODES.RATE_LIMITED, "Too many attempts. Try again shortly.", 429);
  }

  const body = await req.json();
  const input = registerSchema.parse(body);

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    return fail(ERROR_CODES.CONFLICT, "An account with this email already exists.", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role: input.role,
      organisationName: input.organisationName,
      verificationStatus: input.role === "RECIPIENT" ? "PENDING" : "VERIFIED",
      ...(input.latitude != null && input.longitude != null
        ? { latitude: input.latitude, longitude: input.longitude }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      organisationName: true,
      verificationStatus: true,
    },
  });

  // New recipients start with default matching preferences.
  if (user.role === "RECIPIENT") {
    await prisma.recipientPreference.create({
      data: { userId: user.id },
    });
  }

  await audit(prisma, AUDIT_ACTIONS.USER_REGISTERED, "User", user.id, user.id, {
    role: user.role,
  });

  return ok(
    {
      user,
      message:
        user.role === "RECIPIENT"
          ? "Registration successful. An administrator must verify your organisation before you can claim food."
          : "Registration successful. You can sign in now.",
    },
    201
  );
});
