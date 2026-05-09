import { getBiteshipRates } from "../services/biteship";
import { eq } from "drizzle-orm";
import { productVariants } from "../schema";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";

export async function calculateShippingRates(
  db: PostgresJsDatabase<typeof schema>,
  destinationAreaId: string, 
  items: { variantId: string, quantity: number }[]
) {
  // 1. Get origin area (Static from config for now)
  const originAreaId = process.env.BITESHIP_ORIGIN_AREA_ID || "IDNP0101"; // Default to Jakarta/Tangerang

  // 2. Fetch product weights and values
  const processedItems = [];
  for (const item of items) {
    const variant = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, item.variantId),
      with: {
        product: true,
      },
    });

    if (!variant) throw new Error(`Varian ${item.variantId} tidak ditemukan`);

    processedItems.push({
      name: variant.product.name,
      value: variant.price_override || variant.product.base_price,
      weight: variant.product.weight_grams,
      length: 10, // Default 10cm
      width: 10,
      height: 10,
      quantity: item.quantity,
    });
  }

  // 3. Call Biteship
  return await getBiteshipRates({
    origin_area_id: originAreaId,
    destination_area_id: destinationAreaId,
    couriers: "jne,jnt,sicepat,anteraja,lion",
    items: processedItems,
  });
}
