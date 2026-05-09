import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { updateAdminOrderStatus } from "@bananasbindery/db";

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

    // Use centralized logic
    const updatedOrder = await updateAdminOrderStatus(db, id, {
      status: body.status,
      tracking_number: body.tracking_number,
      cancel_reason: body.cancel_reason,
    });

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "Gagal memperbarui pesanan" },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: updatedOrder });
  } catch (error: unknown) {
    console.error("Admin Order Update Error:", error);
    return NextResponse.json(
      {
        error: (error as Error).message || "Gagal memproses pembaruan pesanan",
      },
      { status: 500 }
    );
  }
}
