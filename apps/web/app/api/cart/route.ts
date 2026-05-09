import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCart, addToCart, removeFromCart } from "@bananasbindery/db";

export async function GET() {
  try {
    const user = await getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cart = await getCart(db, user.id);
    return NextResponse.json({ data: cart });
  } catch (error: unknown) {
    console.error("Fetch Cart Error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil keranjang" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { variant_id, quantity } = await req.json();

    if (!variant_id || !quantity) {
      return NextResponse.json(
        { error: "Varian dan jumlah wajib diisi" },
        { status: 400 }
      );
    }

    const result = await addToCart(db, user.id, variant_id, quantity);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Update Cart Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Gagal memperbarui keranjang" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("id");

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID wajib diisi" },
        { status: 400 }
      );
    }

    const result = await removeFromCart(db, itemId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Delete Cart Item Error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus item" },
      { status: 500 }
    );
  }
}
