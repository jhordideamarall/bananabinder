import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processAbandonedCarts } from "@bananasbindery/db";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    // Security check
    if (token !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await processAbandonedCarts(db);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    console.error("Cron Abandoned Cart Error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
