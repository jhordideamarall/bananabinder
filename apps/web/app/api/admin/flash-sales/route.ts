import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase";

interface FlashSaleItem {
  product_id: string;
  variant_id: string;
  discount_price: number;
  stock_limit: number;
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("flash_sales")
      .select(
        `
        *,
        flash_sale_items (*)
      `
      )
      .order("start_time", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, start_time, end_time, items } = await req.json();

    // Start transaction-like flow (sequential with error handling)
    const { data: sale, error: saleError } = await supabaseAdmin
      .from("flash_sales")
      .insert({ name, start_time, end_time })
      .select("id")
      .single();

    if (saleError) throw saleError;

    if (items && items.length > 0) {
      const { error: itemsError } = await supabaseAdmin
        .from("flash_sale_items")
        .insert(
          items.map((item: FlashSaleItem) => ({
            ...item,
            flash_sale_id: sale.id,
          }))
        );

      if (itemsError) throw itemsError;
    }

    return NextResponse.json({ success: true, id: sale.id });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
