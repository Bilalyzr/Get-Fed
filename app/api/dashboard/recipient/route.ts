import { requireRole } from "@/lib/session";
import { ok, withApi } from "@/lib/api";
import { getRecipientDashboard } from "@/services/dashboard.service";

export const dynamic = "force-dynamic";

// GET /api/dashboard/recipient (PRD §38/§42).
export const GET = withApi(async () => {
  const user = await requireRole("RECIPIENT");
  const dashboard = await getRecipientDashboard(user.id);
  return ok(dashboard);
});
