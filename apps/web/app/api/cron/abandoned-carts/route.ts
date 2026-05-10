import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processAbandonedCarts } from "@bananasbindery/db";

/**
 * Vercel Cron Job: Process abandoned carts every 6 hours
 * Triggered by Vercel Cron with Authorization header
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    // Secure the endpoint using CRON_SECRET
    if (
      process.env.NODE_ENV === "production" &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await processAbandonedCarts(db);

    return NextResponse.json({
      success: true,
      message: "Abandoned cart reminders processed",
      ...result,
    });
  } catch (error: unknown) {
    console.error("Cron Abandoned Carts Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
