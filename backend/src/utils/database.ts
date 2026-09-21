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

  await database.query(`
    INSERT INTO categories (id, name, description, created_at)
    SELECT gen_random_uuid(), 'Goteros', 'Goteros para sistemas de riego', NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM categories WHERE name = 'Goteros'
    );
  `);

  await database.query(`
    INSERT INTO products (
      id, name, description, price, stock, category_id, diameter, material, working_pressure, created_at
    )
    SELECT gen_random_uuid(),
      'Gotero regulable',
      'Gotero regulable para controlar el caudal de riego.',
      100,
      20,
      (SELECT id FROM categories WHERE name = 'Goteros' LIMIT 1),
      '16',
      'PVC',
      '2',
      NOW()
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Gotero regulable');

    INSERT INTO products (
      id, name, description, price, stock, category_id, diameter, material, working_pressure, created_at
    )
    SELECT gen_random_uuid(),
      'Gotero autocompensante',
      'Gotero de caudal estable para riego uniforme.',
      150,
      15,
      (SELECT id FROM categories WHERE name = 'Goteros' LIMIT 1),
      '16',
      'Polietileno',
      '3',
      NOW()
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Gotero autocompensante');

    INSERT INTO products (
      id, name, description, price, stock, category_id, diameter, material, working_pressure, created_at
    )
    SELECT gen_random_uuid(),
      'Gotero con pulsador',
      'Gotero con pulsador para riego localizado.',
      200,
      12,
      (SELECT id FROM categories WHERE name = 'Goteros' LIMIT 1),
      '16',
      'PVC',
      '2',
      NOW()
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Gotero con pulsador');
  `);
}
