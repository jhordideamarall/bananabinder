import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateShippingRates } from "@bananasbindery/db";
import { eq } from "drizzle-orm";
import { addresses } from "@bananasbindery/db";
import { getUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { addressId, items } = await req.json();

    if (!addressId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    // 1. Get Address Details
    const addr = await db.query.addresses.findFirst({
      where: eq(addresses.id, addressId),
    });

    if (!addr || !addr.biteship_area_id) {
      return NextResponse.json(
        { error: "Alamat tidak valid atau area Biteship belum diset" },
        { status: 400 }
      );
    }

    // 2. Calculate Rates via Biteship Logic
    const rates = await calculateShippingRates(
      db,
      addr.biteship_area_id,
      items
    );

    return NextResponse.json({ rates });
  } catch (error: unknown) {
    console.error("Shipping Rate Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Gagal mengambil biaya pengiriman" },
      { status: 500 }
    );
  }
}
