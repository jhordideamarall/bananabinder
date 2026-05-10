import { and, lt, gt } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";
import { carts } from "../schema";
import { sendWhatsAppMessage } from "../services/fonnte";
import { eq } from "drizzle-orm";

export async function validateCoupon(
  db: PostgresJsDatabase<typeof schema>,
  code: string,
  subtotal: number
) {
  const coupon = await db.query.coupons.findFirst({
    where: and(
      eq(schema.coupons.code, code),
      eq(schema.coupons.is_active, true)
    ),
  });

  if (!coupon) throw new Error("Kupon tidak ditemukan atau tidak aktif");

  const now = new Date();
  if (coupon.valid_from > now) throw new Error("Kupon belum bisa digunakan");
  if (coupon.valid_until < now) throw new Error("Kupon sudah kadaluarsa");

  if (coupon.usage_limit && (coupon.used_count || 0) >= coupon.usage_limit) {
    throw new Error("Kuota penggunaan kupon sudah habis");
  }

  if (subtotal < (coupon.min_purchase_amount || 0)) {
    throw new Error(
      `Minimal pembelian untuk kupon ini adalah Rp ${(
        coupon.min_purchase_amount || 0
      ).toLocaleString("id-ID")}`
    );
  }

  return coupon;
}

export async function processAbandonedCarts(
  db: PostgresJsDatabase<typeof schema>
) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const abandonedCarts = await db.query.carts.findMany({
    where: and(
      lt(carts.updated_at, twentyFourHoursAgo),
      gt(carts.updated_at, fortyEightHoursAgo)
    ),
    with: {
      user: true,
      items: {
        with: {
          variant: {
            with: {
              product: true,
            },
          },
        },
      },
    },
  });

  let sentCount = 0;
  for (const cart of abandonedCarts) {
    if (!cart.user?.phone) continue;

    const itemsCount = cart.items.length;
    if (itemsCount === 0) continue;

    const firstItemName = cart.items[0]?.variant?.product?.name || "produk";
    const message = `Halo ${cart.user.full_name || "Kak"}! Kamu masih punya ${itemsCount} item di keranjang Bananasbindery (termasuk ${firstItemName}). Selesaikan pesananmu sekarang sebelum stok habis! 🍌`;

    try {
      await sendWhatsAppMessage(cart.user.phone, message);
      sentCount++;
    } catch (error) {
      console.error(`Gagal mengirim reminder ke ${cart.user.phone}:`, error);
    }
  }

  return {
    processed: abandonedCarts.length,
    sent: sentCount,
  };
}
