import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Factory to create a Drizzle database client.
 * Note: Use the connection string for direct database access (bypassing Supabase API).
 */
export function createDrizzleClient(connectionString: string) {
  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema });
}

export type DbClient = ReturnType<typeof createDrizzleClient>;
