import { hashPassword } from "../utils/password";
import { database } from "./connection";

interface SeedProduct {
  name: string;
  description: string;
  price: number;
  stock: number;
  diameter: string;
  material: string;
  workingPressure: string;
  imageUrl: string;
}

const SEED_PRODUCTS: SeedProduct[] = [
  {
    name: "Gotero 4Lh Swll",
    description: "Gotero de 4 L/h para riego uniforme y alta precisión.",
    price: 180,
    stock: 20,
    diameter: "16",
    material: "PVC",
    workingPressure: "2",
    imageUrl: "images/products/gotero-swll.png",
  },
  {
    name: "Gotero 8Lh Swll",
    description: "Gotero de caudal estable para riego uniforme.",
    price: 150,
    stock: 15,
    diameter: "16",
    material: "Polietileno",
    workingPressure: "3",
    imageUrl: "images/products/gotero-swll.png",
  },
  {
    name: "Gotero Autocompensado Pce05 2L-H R. Bird Azul",
    description: "Gotero autocompensado para riego localizado y alta uniformidad.",
    price: 200,
    stock: 12,
    diameter: "16",
    material: "PVC",
    workingPressure: "2",
    imageUrl: "images/products/gotero-autocompensado-pce05.png",
  },
];

async function seedAdmin(): Promise<void> {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@hidrocenter.cl").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin123!";
  const adminName = process.env.ADMIN_NAME ?? "Administrador";

  // Si el administrador ya existe, solo se asegura su rol; su contraseña no se modifica.
  await database.query(
    `INSERT INTO users (id, name, email, password, role, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, 'admin', NOW())
     ON CONFLICT (email) DO UPDATE SET role = 'admin', status = 'approved'`,
    [adminName, adminEmail, await hashPassword(adminPassword)],
  );
}

async function seedCatalog(): Promise<void> {
  await database.query(`
    INSERT INTO categories (id, name, description, created_at)
    SELECT gen_random_uuid(), 'Goteros', 'Goteros para sistemas de riego', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Goteros');
  `);

  for (const product of SEED_PRODUCTS) {
    await database.query(
      `INSERT INTO products (
         id, name, description, price, stock, category_id, diameter, material, working_pressure, image_url, created_at
       )
       SELECT gen_random_uuid(), $1::varchar, $2, $3, $4,
         (SELECT id FROM categories WHERE name = 'Goteros' LIMIT 1),
         $5, $6, $7, $8, NOW()
       WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = $1::varchar)`,
      [
        product.name,
        product.description,
        product.price,
        product.stock,
        product.diameter,
        product.material,
        product.workingPressure,
        product.imageUrl,
      ],
    );
  }
}

// Datos iniciales: se pueden ejecutar varias veces sin duplicar nada.
export async function seedDatabase(): Promise<void> {
  await seedAdmin();
  await seedCatalog();
}
