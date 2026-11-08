import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { database } from "../../db/connection";
import { api, loginAsAdmin } from "./helpers/api";

// El administrador crea categorías (sueltas o dentro de un grupo) y productos desde el panel.
const testId = Date.now();
const groupName = `Grupo test ${testId}`;
const createdCategoryIds: string[] = [];
let adminToken = "";

async function createCategory(body: Record<string, unknown>) {
  const result = await api("POST", "/api/categories", body, adminToken);
  if (result.body?.id) createdCategoryIds.push(result.body.id);
  return result;
}

beforeAll(async () => {
  adminToken = await loginAsAdmin();
});

afterAll(async () => {
  if (createdCategoryIds.length) {
    await database.query("DELETE FROM products WHERE category_id = ANY($1::uuid[])", [createdCategoryIds]);
    await database.query("DELETE FROM categories WHERE id = ANY($1::uuid[])", [createdCategoryIds]);
  }
  await database.end();
});

describe("Crear categorías y productos desde el panel de administración", () => {
  it("crea una categoría dentro de un grupo y aparece en el catálogo", async () => {
    const created = await createCategory({ name: `Centrífugas ${testId}`, groupName });

    expect(created.status).toBe(201);
    expect(created.body.groupName).toBe(groupName);

    const categories = await api("GET", "/api/categories");
    expect(categories.body.some((category: { id: string }) => category.id === created.body.id)).toBe(true);
  });

  it("una categoría nueva sin grupo también se muestra", async () => {
    const created = await createCategory({ name: `Válvulas ${testId}` });

    expect(created.status).toBe(201);
    expect(created.body.groupName).toBeNull();

    const categories = await api("GET", "/api/categories");
    expect(categories.body.some((category: { id: string }) => category.id === created.body.id)).toBe(true);
  });

  it("no permite dos categorías con el mismo nombre en el mismo grupo", async () => {
    const name = `Duplicada ${testId}`;
    expect((await createCategory({ name, groupName })).status).toBe(201);

    const duplicated = await createCategory({ name: name.toUpperCase(), groupName });
    expect(duplicated.status).toBe(409);
    expect(duplicated.body.message).toContain("Ya existe la categoría");

    // En otro grupo el mismo nombre sí está permitido.
    expect((await createCategory({ name, groupName: `${groupName} B` })).status).toBe(201);
  });

  it("un producto creado en una categoría nueva aparece en el listado", async () => {
    const category = await createCategory({ name: `Presurizadoras ${testId}`, groupName });
    const product = await api("POST", "/api/products", {
      name: `Bomba test ${testId}`,
      price: 129990,
      stock: 4,
      categoryId: category.body.id,
    }, adminToken);

    expect(product.status).toBe(201);
    const products = await api("GET", "/api/products");
    expect(products.body.some((item: { id: string }) => item.id === product.body.id)).toBe(true);
  });

  it("las categorías antiguas ocultas siguen sin mostrarse", async () => {
    const hidden = await database.query<{ id: string }>("SELECT id FROM categories WHERE NOT visible");
    const categories = await api("GET", "/api/categories");
    const visibleIds = new Set(categories.body.map((category: { id: string }) => category.id));

    expect(hidden.rows.every((row) => !visibleIds.has(row.id))).toBe(true);
  });
});
