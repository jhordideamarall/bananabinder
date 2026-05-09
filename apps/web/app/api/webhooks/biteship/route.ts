import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleBiteshipWebhook } from "@bananasbindery/db";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("[Biteship Webhook] Received:", payload);

    // Basic event filter
    if (payload.event !== "order.status") {
      return NextResponse.json({ success: true, message: "Ignored event" });
    }

    const result = await handleBiteshipWebhook(db, {
      event: payload.event,
      order_id: payload.order_id,
      status: payload.status,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[Biteship Webhook] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
