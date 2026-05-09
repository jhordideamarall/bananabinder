import { createDrizzleClient } from "../src/drizzle";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load .env from root
dotenv.config({ path: resolve(__dirname, "../../../.env") });

const dbUrl = process.env.DATABASE_URL;

async function main() {
  if (!dbUrl) {
    console.error("DATABASE_URL is not set in .env");
    return;
  }

  console.log("Connecting to:", dbUrl.replace(/:([^:@]+)@/, ":****@"));
  
  const db = createDrizzleClient(dbUrl);

  try {
    const result = await db.execute("SELECT 1 as connected");
    console.log("Connection successful!", result);
    process.exit(0);
  } catch (error) {
    console.error("Connection failed:", error);
    process.exit(1);
  }
}

main();
