import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { ok, withApi } from "@/lib/api";

export const dynamic = "force-dynamic";

// GET /api/notifications — in-app notification feed + unread count (PRD §25).
export const GET = withApi(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const unreadOnly = url.searchParams.get("unread") === "true";

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id, ...(unreadOnly ? { read: false } : {}) },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
  ]);

  return ok({
    notifications: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount,
  });
});

// PATCH /api/notifications — mark all (or a list) as read.
export const PATCH = withApi(async (req: Request) => {
  const user = await requireUser();
  const body = (await req.json().catch(() => ({}))) as { ids?: string[] };

  await prisma.notification.updateMany({
    where: { userId: user.id, ...(body.ids?.length ? { id: { in: body.ids } } : {}) },
    data: { read: true },
  });

  return ok({ message: "Notifications marked as read." });
});
