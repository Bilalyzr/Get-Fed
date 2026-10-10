import { requireRole } from "@/lib/session";
import { ok, withApi } from "@/lib/api";
import { getProviderAnalytics } from "@/services/analytics.service";

export const dynamic = "force-dynamic";

// GET /api/provider/analytics (PRD §38/§41).
export const GET = withApi(async () => {
  const user = await requireRole("PROVIDER");
  const analytics = await getProviderAnalytics(user.id);
  return ok(analytics);
});
