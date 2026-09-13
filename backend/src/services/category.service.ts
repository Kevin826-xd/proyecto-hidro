import { Category, CreateCategoryInput } from "../entities/category.entity";
import { database } from "../utils/database";

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const result = await database.query<Category>(
    `INSERT INTO categories (id, name, description, created_at)
     VALUES (gen_random_uuid(), $1, $2, NOW())
     RETURNING id, name, description, created_at AS "createdAt"`,
    [input.name, input.description ?? null],
  );

  return result.rows[0];
}

export async function listCategories(): Promise<Category[]> {
  const result = await database.query<Category>(
    `SELECT id, name, description, created_at AS "createdAt"
     FROM categories ORDER BY created_at DESC`,
  );

  return result.rows;
}

export async function categoryExists(categoryId: string): Promise<boolean> {
  const result = await database.query(
    "SELECT 1 FROM categories WHERE id = $1",
    [categoryId],
  );

  return result.rowCount === 1;
}
