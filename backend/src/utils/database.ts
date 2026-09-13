import path from "node:path";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({
  path: path.resolve(__dirname, "../../../.env"),
  override: true,
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

export async function initializeDatabase(): Promise<void> {
  await database.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price NUMERIC(12, 2) NOT NULL,
      stock INTEGER NOT NULL,
      category_id UUID NOT NULL REFERENCES categories(id),
      diameter VARCHAR(100),
      material VARCHAR(100),
      working_pressure VARCHAR(100),
      created_at TIMESTAMPTZ NOT NULL
    );
  `);
}
