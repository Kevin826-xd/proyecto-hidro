// Cada migración cambia el esquema una sola vez y queda registrada en schema_migrations.
// Para cambiar la base de datos se agrega una migración nueva al final; nunca se editan las ya aplicadas.
export interface Migration {
  name: string;
  sql: string;
}

export const migrations: Migration[] = [
  {
    name: "001_create_initial_tables",
    sql: `
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
    `,
  },
  {
    name: "002_add_user_role",
    sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'customer';`,
  },
  {
    // Los usuarios que ya existían quedan aprobados; los nuevos registros parten como 'pending'.
    name: "003_add_user_approval",
    sql: `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'approved',
      ADD COLUMN IF NOT EXISTS approval_token_hash VARCHAR(64);
    `,
  },
  {
    name: "004_add_delivery_location",
    sql: `
      ALTER TABLE delivery_reservations
      ADD COLUMN IF NOT EXISTS delivery_lat DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS delivery_lng DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS delivery_distance_km DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS delivery_cost INTEGER;
    `,
  },
  {
    // Un carrito por usuario. Si se borra el usuario o el producto, se borran sus filas del carrito.
    name: "005_create_cart_items",
    sql: `
      CREATE TABLE IF NOT EXISTS cart_items (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, product_id)
      );
    `,
  },
  {
    // Corrige los nombres y precios de los goteros creados con datos de prueba antiguos.
    name: "006_rename_legacy_drippers",
    sql: `
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
    `,
  },
  {
    // La imagen de cada producto se guarda en la base de datos en vez de decidirse en el frontend.
    name: "007_add_product_image",
    sql: `
      ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

      UPDATE products SET image_url = 'images/products/gotero-swll.png'
      WHERE image_url IS NULL AND name IN ('Gotero 4Lh Swll', 'Gotero 8Lh Swll');

      UPDATE products SET image_url = 'images/products/gotero-autocompensado-pce05.png'
      WHERE image_url IS NULL AND name = 'Gotero Autocompensado Pce05 2L-H R. Bird Azul';
    `,
  },
];
