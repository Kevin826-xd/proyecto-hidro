import { Pool } from "pg";
import { env } from "../config/env";

export const database = new Pool({
  connectionString: env.databaseUrl,
});

export async function checkDatabaseConnection(): Promise<void> {
  const client = await database.connect();

  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}
