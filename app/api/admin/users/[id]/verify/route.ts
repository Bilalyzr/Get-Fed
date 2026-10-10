import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { ok, withApi, AppError, ERROR_CODES } from "@/lib/api";
import { audit, AUDIT_ACTIONS } from "@/lib/audit";
import { createNotifications } from "@/lib/notifications";
import { z } from "zod";

export const dynamic = "force-dynamic";

const verifySchema = z.object({
  status: z.enum(["PENDING", "VERIFIED", "REJECTED", "SUSPENDED"]),
});

// POST /api/admin/users/:id/verify — admin changes verification status
// (PRD §8/§47: only ADMIN can verify/suspend).
export const POST = withApi<{ params: { id: string } }>(async (req, { params }) => {
  const admin = await requireRole("ADMIN");
  const body = await req.json();
  const { status } = verifySchema.parse(body);

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) throw new AppError(ERROR_CODES.NOT_FOUND, "User not found.", 404);
  if (user.role === "ADMIN") {
    throw new AppError(ERROR_CODES.FORBIDDEN, "Admin accounts cannot be re-verified.", 403);
  }
  if (user.verificationStatus === status) {
    return ok({ user, message: `Status already ${status.toLowerCase()}.` });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id: params.id },
      data: { verificationStatus: status },
      select: { id: true, name: true, email: true, role: true, organisationName: true, verificationStatus: true },
    });

    const action =
      status === "SUSPENDED" ? AUDIT_ACTIONS.USER_SUSPENDED : AUDIT_ACTIONS.USER_VERIFIED;
    await audit(tx, action, "User", u.id, admin.id, { from: user.verificationStatus, to: status });

    if (status === "VERIFIED") {
      await createNotifications(tx, [
        {
          userId: u.id,
          title: "Organisation verified",
          message: "Your organisation has been verified. You can now discover and claim surplus food.",
          type: "SYSTEM",
        },
      ]);
    } else if (status === "SUSPENDED") {
      await createNotifications(tx, [
        {
          userId: u.id,
          title: "Account suspended",
          message: "Your account has been suspended by an administrator. Contact support for details.",
          type: "SYSTEM",
        },
      ]);
    }

    return u;
  });

  return ok({ user: updated, message: `Verification status set to ${status}.` });
});
