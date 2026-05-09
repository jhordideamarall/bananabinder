import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createOrder, createXenditInvoice, orders } from "@bananasbindery/db";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { items, couponCode, addressId, courier, shippingCost } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Keranjang kosong" }, { status: 400 });
    }

    if (!addressId) {
      return NextResponse.json(
        { error: "Alamat pengiriman wajib diisi" },
        { status: 400 }
      );
    }

    // 1. Create Order using Shared Logic (Handles Stock & Transaction)
    const { order, calculation } = await createOrder(db, user.id, {
      items,
      couponCode,
      addressId,
      courier,
      shippingCost: shippingCost || 0,
    });

    // 2. Create Xendit Invoice
    const invoice = await createXenditInvoice({
      externalId: order.id,
      amount: order.total_amount,
      payerEmail: user.email || "customer@example.com",
      description: `Order #${order.id.slice(0, 8)} - Bananasbindery`,
      items: calculation.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
    });

    // 3. Update Order with Invoice ID
    await db
      .update(orders)
      .set({
        xendit_invoice_id: invoice.externalId,
        xendit_payment_url: invoice.invoiceUrl,
      })
      .where(eq(orders.id, order.id));

    return NextResponse.json({
      orderId: order.id,
      invoiceUrl: invoice.invoiceUrl,
    });
  } catch (error: unknown) {
    console.error("Checkout Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Gagal memproses checkout" },
      { status: 500 }
    );
  }
}
