import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { getAdminProducts, createAdminProduct } from "@bananasbindery/db";

export async function GET() {
  try {
    const user = await getUser();
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await getAdminProducts(db);
    return NextResponse.json({ data });
  } catch (error: unknown) {
    console.error("Admin Products GET Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = await createAdminProduct(db, body);
    return NextResponse.json({ data });
  } catch (error: unknown) {
    console.error("Admin Products POST Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
