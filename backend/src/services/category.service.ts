import { Category, CreateCategoryInput } from "../entities/category.entity";
import { database } from "../db/connection";
import { ConflictError } from "../errors/http-errors";

const CATEGORY_COLUMNS = `id, name, description, group_name AS "groupName", created_at AS "createdAt"`;

// Dos categorías no pueden llamarse igual dentro del mismo grupo (sin importar mayúsculas).
// Sí se permite el mismo nombre en grupos distintos, por ejemplo "Accesorios" en Bombas y en Estanques.
async function categoryNameTaken(name: string, groupName: string | null): Promise<boolean> {
  const result = await database.query(
    `SELECT 1 FROM categories
     WHERE LOWER(name) = LOWER($1) AND LOWER(group_name) IS NOT DISTINCT FROM LOWER($2)`,
    [name, groupName],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const groupName = input.groupName ?? null;

  if (await categoryNameTaken(input.name, groupName)) {
    throw new ConflictError(groupName
      ? `Ya existe la categoría "${input.name}" en el grupo "${groupName}"`
      : `Ya existe la categoría "${input.name}"`);
  }

  const result = await database.query<Category>(
    `INSERT INTO categories (id, name, description, group_name, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, NOW())
     RETURNING ${CATEGORY_COLUMNS}`,
    [input.name, input.description ?? null, groupName],
  );

  return result.rows[0];
}

// Solo las categorías visibles: las antiguas de prueba quedan ocultas (ver migración 010).
export async function listCategories(): Promise<Category[]> {
  const result = await database.query<Category>(
    `SELECT ${CATEGORY_COLUMNS}
     FROM categories
     WHERE visible
     ORDER BY created_at ASC`,
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
