import path from "node:path";
import dotenv from "dotenv";
import { Pool } from "pg";

// La configuración se lee desde backend/.env (también al ejecutar el código compilado en dist/).
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
  override: true,
  quiet: true,
});

export const database = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function checkDatabaseConnection(): Promise<void> {
  const client = await database.connect();

  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}
