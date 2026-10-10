import { requireRole } from "@/lib/session";
import { ok, withApi } from "@/lib/api";
import { getProviderDashboard } from "@/services/dashboard.service";

export const dynamic = "force-dynamic";

// GET /api/dashboard/provider (PRD §38/§41).
export const GET = withApi(async () => {
  const user = await requireRole("PROVIDER", "ADMIN");
  const dashboard = await getProviderDashboard(user.id);
  return ok(dashboard);
});
