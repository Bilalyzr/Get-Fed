import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// Audit logging (PRD §37/§60): every critical action is traceable.
// Always fire-and-forget-safe: an audit failure must never break the main
// operation, but errors are surfaced to server logs.
// ---------------------------------------------------------------------------

export const AUDIT_ACTIONS = {
  FOOD_LISTING_CREATED: "FOOD_LISTING_CREATED",
  FOOD_LISTING_UPDATED: "FOOD_LISTING_UPDATED",
  FOOD_LISTING_CANCELLED: "FOOD_LISTING_CANCELLED",
  LISTING_EXPIRED: "LISTING_EXPIRED",
  CLAIM_CREATED: "CLAIM_CREATED",
  CLAIM_CANCELLED: "CLAIM_CANCELLED",
  COLLECTION_CONFIRMED: "COLLECTION_CONFIRMED",
  PICKUP_STARTED: "PICKUP_STARTED",
  CLAIM_NO_SHOW: "CLAIM_NO_SHOW",
  USER_REGISTERED: "USER_REGISTERED",
  USER_VERIFIED: "USER_VERIFIED",
  USER_SUSPENDED: "USER_SUSPENDED",
  USER_LOGIN: "USER_LOGIN",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  QR_SCAN_REJECTED: "QR_SCAN_REJECTED",
  TRACKING_STARTED: "TRACKING_STARTED",
  TRACKING_RESUMED: "TRACKING_RESUMED",
  TRACKING_ARRIVED: "TRACKING_ARRIVED",
  TRACKING_DELAYED: "TRACKING_DELAYED",
  TRACKING_STALE: "TRACKING_STALE",
  TRACKING_STOPPED: "TRACKING_STOPPED",
  TRACKING_COMPLETED: "TRACKING_COMPLETED",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export async function audit(
  tx: Prisma.TransactionClient | typeof prisma,
  action: AuditAction,
  entityType: string,
  entityId: string | null | undefined,
  userId?: string | null,
  metadata?: Prisma.InputJsonValue
): Promise<void> {
  try {
    await tx.auditLog.create({
      data: {
        action,
        entityType,
        entityId: entityId ?? null,
        userId: userId ?? null,
        metadata: metadata ?? undefined,
      },
    });
  } catch (error) {
    console.error(`[audit] failed to record ${action}:`, error);
  }
}
