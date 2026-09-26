import path from "node:path";
import crypto from "node:crypto";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({
  path: path.resolve(__dirname, "../../..env"),
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
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );

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

    CREATE TABLE IF NOT EXISTS delivery_reservations (
      id UUID PRIMARY KEY,
      user_email VARCHAR(255) NOT NULL,
      delivery_date DATE NOT NULL UNIQUE,
      delivery_city VARCHAR(255),
      delivery_address VARCHAR(255),
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
  `);

  await database.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'customer';
  `);

  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@hidrocenter.cl").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin123!";
  const adminName = process.env.ADMIN_NAME ?? "Administrador";
  const adminPasswordHash = crypto.createHash("sha256").update(adminPassword).digest("hex");

  await database.query(
    `INSERT INTO users (id, name, email, password, role, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, 'admin', NOW())
     ON CONFLICT (email) DO UPDATE SET role = 'admin'`,
    [adminName, adminEmail, adminPasswordHash],
  );

  await database.query(`
    INSERT INTO categories (id, name, description, created_at)
    SELECT gen_random_uuid(), 'Goteros', 'Goteros para sistemas de riego', NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM categories WHERE name = 'Goteros'
    );
  `);

  await database.query(`
    UPDATE products
    SET name = CASE
      WHEN name ILIKE '%regulable%' THEN 'Gotero 4Lh Swll'
      WHEN name ILIKE '%autocompensante%' THEN 'Gotero 8Lh Swll'
      WHEN name ILIKE '%pulsador%' THEN 'Gotero Autocompensado Pce05 2L-H R. Bird Azul'
      ELSE name
    END,
    description = CASE
      WHEN name ILIKE '%regulable%' THEN 'Gotero de 4 L/h para riego uniforme y alta precisión.'
      WHEN name ILIKE '%autocompensante%' THEN 'Gotero de caudal estable para riego uniforme.'
      WHEN name ILIKE '%pulsador%' THEN 'Gotero autocompensado para riego localizado y alta uniformidad.'
      ELSE description
    END,
    price = CASE
      WHEN name ILIKE '%regulable%' THEN 180
      WHEN name ILIKE '%autocompensante%' THEN 150
      WHEN name ILIKE '%pulsador%' THEN 200
      ELSE price
    END,
    stock = CASE
      WHEN name ILIKE '%regulable%' THEN 20
      WHEN name ILIKE '%autocompensante%' THEN 15
      WHEN name ILIKE '%pulsador%' THEN 12
      ELSE stock
    END
    WHERE category_id IN (SELECT id FROM categories WHERE name = 'Goteros');
  `);

  await database.query(`
    INSERT INTO products (
      id, name, description, price, stock, category_id, diameter, material, working_pressure, created_at
    )
    SELECT gen_random_uuid(),
      'Gotero 4Lh Swll',
      'Gotero de 4 L/h para riego uniforme y alta precisión.',
      180,
      20,
      (SELECT id FROM categories WHERE name = 'Goteros' LIMIT 1),
      '16',
      'PVC',
      '2',
      NOW()
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Gotero 4Lh Swll');

    INSERT INTO products (
      id, name, description, price, stock, category_id, diameter, material, working_pressure, created_at
    )
    SELECT gen_random_uuid(),
      'Gotero 8Lh Swll',
      'Gotero de caudal estable para riego uniforme.',
      150,
      15,
      (SELECT id FROM categories WHERE name = 'Goteros' LIMIT 1),
      '16',
      'Polietileno',
      '3',
      NOW()
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Gotero 8Lh Swll');

    INSERT INTO products (
      id, name, description, price, stock, category_id, diameter, material, working_pressure, created_at
    )
    SELECT gen_random_uuid(),
      'Gotero Autocompensado Pce05 2L-H R. Bird Azul',
      'Gotero autocompensado para riego localizado y alta uniformidad.',
      200,
      12,
      (SELECT id FROM categories WHERE name = 'Goteros' LIMIT 1),
      '16',
      'PVC',
      '2',
      NOW()
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Gotero Autocompensado Pce05 2L-H R. Bird Azul');
  `);
}
