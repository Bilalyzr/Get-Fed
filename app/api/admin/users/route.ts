import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { ok, withApi } from "@/lib/api";

export const dynamic = "force-dynamic";

// GET /api/admin/users — user management list (PRD §38 admin, §43).
export const GET = withApi(async (req: Request) => {
  await requireRole("ADMIN");
  const url = new URL(req.url);
  const roleFilter = url.searchParams.get("role");
  const statusFilter = url.searchParams.get("status");
  const search = url.searchParams.get("q");

  const users = await prisma.user.findMany({
    where: {
      ...(roleFilter ? { role: roleFilter as "PROVIDER" | "RECIPIENT" | "ADMIN" } : {}),
      ...(statusFilter
        ? { verificationStatus: statusFilter as "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED" }
        : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { organisationName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      organisationName: true,
      verificationStatus: true,
      createdAt: true,
      _count: { select: { listings: true, claims: true } },
    },
  });

  return ok(users);
});
