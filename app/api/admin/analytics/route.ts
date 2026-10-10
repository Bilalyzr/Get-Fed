import { requireRole } from "@/lib/session";
import { ok, withApi } from "@/lib/api";
import { getAdminAnalytics } from "@/services/analytics.service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/admin/analytics — platform analytics + audit trail (PRD §29/§43).
export const GET = withApi(async () => {
  await requireRole("ADMIN");
  const [analytics, auditLogs] = await Promise.all([
    getAdminAnalytics(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { name: true, organisationName: true, role: true } } },
    }),
  ]);

  return ok({
    analytics,
    auditLogs: auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: log.metadata,
      createdAt: log.createdAt.toISOString(),
      actor: log.user
        ? { name: log.user.name, organisation: log.user.organisationName, role: log.user.role }
        : { name: "System", organisation: "Get Fed", role: "SYSTEM" },
    })),
  });
});
