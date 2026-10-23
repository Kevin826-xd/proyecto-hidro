import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { database } from "../../db/connection";
import { api, loginAsAdmin } from "./helpers/api";

const testCategoryName = `Categoría test ${Date.now()}`;
let categoryId = "";
let adminToken = "";

function productData(overrides: Record<string, unknown> = {}) {
  return {
    name: "Bomba de agua test",
    price: 89990,
    stock: 5,
    categoryId,
    diameter: "25",
    material: "Acero",
    workingPressure: "6",
    ...overrides,
  };
}

beforeAll(async () => {
  adminToken = await loginAsAdmin();
  const category = await api("POST", "/api/categories", {
    name: testCategoryName,
    description: "Creada por las pruebas",
  }, adminToken);
  categoryId = category.body?.id ?? "";
});

afterAll(async () => {
  if (categoryId) {
    await database.query("DELETE FROM products WHERE category_id = $1", [categoryId]);
    await database.query("DELETE FROM categories WHERE id = $1", [categoryId]);
  }
  await database.end();
});

describe("Validación al crear productos", () => {
  it("rechaza un precio inválido y una categoría que no existe", async () => {
    const invalidPrice = await api("POST", "/api/products", productData({ price: -100 }), adminToken);

    expect(invalidPrice.status).toBe(400);
    expect(invalidPrice.body.message).toBe("El precio debe ser mayor que cero");

    const missingCategory = await api("POST", "/api/products", productData({ categoryId: randomUUID() }), adminToken);

    expect(missingCategory.status).toBe(404);
    expect(missingCategory.body.message).toBe("Categoría no encontrada");
  });
});