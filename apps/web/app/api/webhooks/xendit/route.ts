import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleOrderPayment } from "@bananasbindery/db";

export async function POST(req: Request) {
  try {
    const callbackToken = req.headers.get("x-callback-token");
    const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN;

    // Verify webhook token
    if (!expectedToken || callbackToken !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { external_id, status } = body;

    if (!external_id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await handleOrderPayment(db, external_id, status);

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error("Xendit Webhook Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
