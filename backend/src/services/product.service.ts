import { CreateProductInput, Product, UpdateProductInput } from "../entities/product.entity";
import { NotFoundError } from "../errors/http-errors";
import { categoryExists } from "./category.service";
import { database } from "../db/connection";
import { isUuid } from "../utils/uuid";

const PRODUCT_COLUMNS = `id, name, description, price, stock,
  category_id AS "categoryId", diameter, material,
  working_pressure AS "workingPressure", image_url AS "imageUrl", created_at AS "createdAt"`;

async function ensureCategoryExists(categoryId: string): Promise<void> {
  if (!isUuid(categoryId) || !(await categoryExists(categoryId))) {
    throw new NotFoundError("Categoría no encontrada");
  }
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  await ensureCategoryExists(input.categoryId);

  const result = await database.query<Product>(
    `INSERT INTO products (
       id, name, description, price, stock, category_id,
       diameter, material, working_pressure, image_url, created_at
     )
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
     RETURNING ${PRODUCT_COLUMNS}`,
    [
      input.name,
      input.description ?? null,
      input.price,
      input.stock,
      input.categoryId,
      input.diameter ?? null,
      input.material ?? null,
      input.workingPressure ?? null,
      input.imageUrl ?? null,
    ],
  );

  return result.rows[0];
}

export async function listProducts(): Promise<Product[]> {
  const result = await database.query<Product>(
    `SELECT ${PRODUCT_COLUMNS}
     FROM products
     WHERE category_id IN (SELECT id FROM categories WHERE name = 'Goteros')
     ORDER BY created_at DESC`,
  );

  return result.rows;
}

export async function getProductById(id: string): Promise<Product> {
  const result = isUuid(id)
    ? await database.query<Product>(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = $1`, [id])
    : null;

  if (!result?.rows[0]) {
    throw new NotFoundError("Producto no encontrado");
  }

  return result.rows[0];
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  const currentProduct = await getProductById(id);

  if (input.categoryId) {
    await ensureCategoryExists(input.categoryId);
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
         working_pressure = $8,
         image_url = $9
     WHERE id = $10
     RETURNING ${PRODUCT_COLUMNS}`,
    [
      nextProduct.name,
      nextProduct.description ?? null,
      nextProduct.price,
      nextProduct.stock,
      nextProduct.categoryId,
      nextProduct.diameter ?? null,
      nextProduct.material ?? null,
      nextProduct.workingPressure ?? null,
      nextProduct.imageUrl ?? null,
      id,
    ],
  );

  return result.rows[0];
}

export async function deleteProduct(id: string): Promise<void> {
  const result = isUuid(id) ? await database.query("DELETE FROM products WHERE id = $1", [id]) : null;

  if (!result?.rowCount) {
    throw new NotFoundError("Producto no encontrado");
  }
}
