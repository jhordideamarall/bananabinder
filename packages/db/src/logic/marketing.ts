import { and, lt, gt } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";
import { carts } from "../schema";
import { sendWhatsAppMessage } from "../services/fonnte";

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
