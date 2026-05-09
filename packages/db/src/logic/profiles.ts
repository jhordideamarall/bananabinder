import { eq, and, desc } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";
import { addresses } from "../schema";

export async function getUserAddresses(
  db: PostgresJsDatabase<typeof schema>,
  userId: string
) {
  return await db.query.addresses.findMany({
    where: eq(addresses.user_id, userId),
    orderBy: [desc(addresses.is_default)],
  });
}

export async function createAddress(
  db: PostgresJsDatabase<typeof schema>,
  userId: string,
  data: typeof schema.addresses.$inferInsert
) {
  // If this is the first address or set as default, unset others
  if (data.is_default) {
    await db
      .update(addresses)
      .set({ is_default: false })
      .where(eq(addresses.user_id, userId));
  }

  const [newAddress] = await db
    .insert(addresses)
    .values({
      ...data,
      user_id: userId,
    })
    .returning();

  return newAddress;
}

export async function updateAddress(
  db: PostgresJsDatabase<typeof schema>,
  addressId: string,
  userId: string,
  data: Partial<typeof schema.addresses.$inferInsert>
) {
  if (data.is_default) {
    await db
      .update(addresses)
      .set({ is_default: false })
      .where(eq(addresses.user_id, userId));
  }

  const [updated] = await db
    .update(addresses)
    .set(data)
    .where(and(eq(addresses.id, addressId), eq(addresses.user_id, userId)))
    .returning();

  return updated;
}
