import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";
import { carts, cartItems, productVariants } from "../schema";

export async function getCart(
  db: PostgresJsDatabase<typeof schema>,
  userId: string
) {
  const cart = await db.query.carts.findFirst({
    where: eq(carts.user_id, userId),
    with: {
      items: {
        with: {
          variant: {
            with: {
              product: {
                with: {
                  productImages: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return cart || { items: [] };
}

export async function addToCart(
  db: PostgresJsDatabase<typeof schema>,
  userId: string,
  variantId: string,
  quantity: number
) {
  // 1. Check stock
  const variant = await db.query.productVariants.findFirst({
    where: eq(productVariants.id, variantId),
  });

  if (!variant) throw new Error("Varian tidak ditemukan");
  if (variant.stock < quantity) throw new Error("Stok tidak mencukupi");

  // 2. Ensure cart exists
  let cart = await db.query.carts.findFirst({
    where: eq(carts.user_id, userId),
  });

  if (!cart) {
    const [newCart] = await db
      .insert(carts)
      .values({ user_id: userId })
      .returning();
    cart = newCart;
  }

  if (!cart) throw new Error("Gagal membuat keranjang");

  // 3. Add/Update item
  await db
    .insert(cartItems)
    .values({
      cart_id: cart.id,
      variant_id: variantId,
      quantity: quantity,
    })
    .onConflictDoUpdate({
      target: [cartItems.cart_id, cartItems.variant_id],
      set: { quantity: quantity },
    });

  return { success: true };
}

export async function removeFromCart(
  db: PostgresJsDatabase<typeof schema>,
  itemId: string
) {
  await db.delete(cartItems).where(eq(cartItems.id, itemId));
  return { success: true };
}
