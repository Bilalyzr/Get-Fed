import { NextResponse } from "next/server";
import { expireOverdueListings, sendPickupReminders } from "@/lib/expiry";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// GET /api/cron/expiry — Vercel Cron entrypoint (PRD §17/§26).
// Runs ~every minute in production via vercel.json. Secured with CRON_SECRET
// (Authorization: Bearer <CRON_SECRET>) when configured; Vercel Cron calls
// include this header automatically when CRON_SECRET env is set.
// ---------------------------------------------------------------------------

export async function GET(req: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json(
        { success: false, code: "UNAUTHORIZED", message: "Invalid cron secret." },
        { status: 401 }
      );
    }
  }

  try {
    const [expiry, reminders] = await Promise.all([
      expireOverdueListings(),
      sendPickupReminders(),
    ]);
    return NextResponse.json({
      success: true,
      data: { expiredListings: expiry.processed, remindersSent: reminders.sent },
    });
  } catch (error) {
    console.error("[cron] expiry run failed:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_ERROR", message: "Cron run failed." },
      { status: 500 }
    );
  }
}
