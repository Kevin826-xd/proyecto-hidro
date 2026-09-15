import { CreateProductInput, Product } from "../entities/product.entity";
import { categoryExists } from "./category.service";
import { database } from "../utils/database";

export async function createProduct(input: CreateProductInput): Promise<Product> {
  if (!(await categoryExists(input.categoryId))) {
    throw new Error("Categoría no encontrada");
  }

  const result = await database.query<Product>(
    `INSERT INTO products (
       id, name, description, price, stock, category_id,
       diameter, material, working_pressure, created_at
     )
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW())
     RETURNING id, name, description, price, stock,
       category_id AS "categoryId", diameter, material,
       working_pressure AS "workingPressure", created_at AS "createdAt"`,
    [
      input.name,
      input.description ?? null,
      input.price,
      input.stock,
      input.categoryId,
      input.diameter ?? null,
      input.material ?? null,
      input.workingPressure ?? null,
    ],
  );

  return result.rows[0];
}

export async function listProducts(): Promise<Product[]> {
  const result = await database.query<Product>(
    `SELECT id, name, description, price, stock,
       category_id AS "categoryId", diameter, material,
       working_pressure AS "workingPressure", created_at AS "createdAt"
     FROM products ORDER BY created_at DESC`,
  );

  return result.rows;
}

export async function getProductById(id: string): Promise<Product | null> {
  const result = await database.query<Product>(
    `SELECT id, name, description, price, stock,
       category_id AS "categoryId", diameter, material,
       working_pressure AS "workingPressure", created_at AS "createdAt"
     FROM products WHERE id = $1`,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function updateProduct(id: string, input: Partial<CreateProductInput>): Promise<Product | null> {
  const currentProduct = await getProductById(id);

  if (!currentProduct) {
    return null;
  }

  if (input.categoryId && !(await categoryExists(input.categoryId))) {
    throw new Error("Categoría no encontrada");
  }

  const nextProduct = {
    ...currentProduct,
    ...input,
  };

  const result = await database.query<Product>(
    `UPDATE products
     SET name = $1,
         description = $2,
         price = $3,
         stock = $4,
         category_id = $5,
         diameter = $6,
         material = $7,
         working_pressure = $8
     WHERE id = $9
     RETURNING id, name, description, price, stock,
       category_id AS "categoryId", diameter, material,
       working_pressure AS "workingPressure", created_at AS "createdAt"`,
    [
      nextProduct.name,
      nextProduct.description ?? null,
      nextProduct.price,
      nextProduct.stock,
      nextProduct.categoryId,
      nextProduct.diameter ?? null,
      nextProduct.material ?? null,
      nextProduct.workingPressure ?? null,
      id,
    ],
  );

  return result.rows[0] ?? null;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const result = await database.query(
    `DELETE FROM products WHERE id = $1`,
    [id],
  );

  return (result.rowCount ?? 0) > 0;
}
