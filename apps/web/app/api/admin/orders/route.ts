import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { getAdminOrders } from "@bananasbindery/db";

export async function GET(req: Request) {
  try {
    const user = await getUser();
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const result = await getAdminOrders(db, { status, page, limit });

    return NextResponse.json({ 
      data: result.data, 
      pagination: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit)
      }
    });
  } catch (error: unknown) {
    console.error("Admin Orders Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
