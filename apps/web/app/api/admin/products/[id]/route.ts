import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { updateAdminProduct } from "@bananasbindery/db";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const data = await updateAdminProduct(db, id, body);
    return NextResponse.json({ data });
  } catch (error: unknown) {
    console.error("Admin Product PATCH Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
