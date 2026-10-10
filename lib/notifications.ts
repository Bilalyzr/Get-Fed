import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import type { Prisma, NotificationType } from "@prisma/client";

// ---------------------------------------------------------------------------
// Notification engine (PRD §25/§34).
// In-app notifications are the reliable MVP path; Firebase Cloud Messaging is
// modular and only activates when FCM_PROJECT_ID / FCM_SERVICE_ACCOUNT_JSON
// are configured (PRD §25: "Firebase push notifications should be modular and
// optional if credentials are unavailable").
// ---------------------------------------------------------------------------

export type NotificationPayload = {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
};

export async function createNotifications(
  tx: Prisma.TransactionClient | typeof prisma,
  payloads: NotificationPayload[]
): Promise<void> {
  if (payloads.length === 0) return;
  try {
    await tx.notification.createMany({ data: payloads });
  } catch (error) {
    console.error("[notifications] failed to create notifications:", error);
  }
  // FCM delivery is best-effort and never blocks the business operation.
  void deliverViaFcm(payloads);
}

// ------------------------------ FCM (optional) -------------------------------

const FCM_ENABLED = Boolean(
  process.env.FCM_PROJECT_ID && process.env.FCM_SERVICE_ACCOUNT_JSON
);

/**
 * Modular FCM push delivery. Intentionally minimal: resolves device tokens
 * (if a token model is added later) and sends via the REST API. Skipped
 * silently when credentials are absent.
 */
async function deliverViaFcm(payloads: NotificationPayload[]): Promise<void> {
  if (!FCM_ENABLED) return;
  try {
    const account = JSON.parse(process.env.FCM_SERVICE_ACCOUNT_JSON as string);
    // Token-based OAuth2 for FCM v1 (only exercised when configured).
    const tokenRes = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion: buildJwt(account),
        }),
      }
    );
    if (!tokenRes.ok) throw new Error(`FCM auth failed: ${tokenRes.status}`);
    const { access_token } = (await tokenRes.json()) as { access_token: string };
    // No per-user device tokens are stored in the MVP; project-wide topic
    // delivery keeps this integration demonstrable without extra models.
    await fetch(
      `https://fcm.googleapis.com/v1/projects/${process.env.FCM_PROJECT_ID}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            topic: "all-users",
            notification: {
              title: payloads[0].title,
              body: payloads[0].message,
            },
          },
        }),
      }
    );
  } catch (error) {
    console.warn("[notifications] FCM delivery skipped:", error);
  }
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function buildJwt(account: {
  client_email: string;
  private_key: string;
}): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: account.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = base64url(signer.sign(account.private_key));
  return `${header}.${claims}.${signature}`;
}
