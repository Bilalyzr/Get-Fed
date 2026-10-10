import { requireRole } from "@/lib/session";
import { ok, withApi } from "@/lib/api";
import { getAdminDashboard } from "@/services/dashboard.service";
import { getAdminAnalytics } from "@/services/analytics.service";

export const dynamic = "force-dynamic";

// GET /api/dashboard/admin (PRD §38/§43).
export const GET = withApi(async () => {
  await requireRole("ADMIN");
  const [dashboard, analytics] = await Promise.all([
    getAdminDashboard(),
    getAdminAnalytics(),
  ]);
  return ok({ ...dashboard, analytics });
});
