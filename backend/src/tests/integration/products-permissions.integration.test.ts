import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { database } from "../../utils/database";
import { ADMIN_EMAIL, api, asUser } from "./helpers/api";

const testId = Date.now();
const customerEmail = `cliente-${testId}@hidrocenter.test`;
const testCategoryName = `Categoría test ${testId}`;
let categoryId = "";

beforeAll(async () => {
  const category = await api("POST", "/api/categories", {
    name: testCategoryName,
    description: "Creada por las pruebas",
  });
  categoryId = category.body?.id ?? "";

  await api("POST", "/api/users/register", {
    name: "Cliente Test",
    email: customerEmail,
    password: "secreto123",
  });
});

afterAll(async () => {
  await database.query("DELETE FROM users WHERE email = $1", [customerEmail]);
  if (categoryId) {
    await database.query("DELETE FROM products WHERE category_id = $1", [categoryId]);
    await database.query("DELETE FROM categories WHERE id = $1", [categoryId]);
  }
  await database.end();
});

describe("Permisos para editar productos", () => {
  it("solo un administrador puede actualizar un producto", async () => {
    const product = await api("POST", "/api/products", {
      name: "Bomba de agua test",
      price: 89990,
      stock: 5,
      categoryId,
      diameter: "25",
      material: "Acero",
      workingPressure: "6",
    });
    const productPath = `/api/products/${product.body.id}`;

    const withoutSession = await api("PUT", productPath, { price: 79990 });
    expect(withoutSession.status).toBe(401);

    const asCustomer = await api("PUT", `${productPath}${asUser(customerEmail)}`, { price: 79990 });
    expect(asCustomer.status).toBe(403);

    const asAdmin = await api("PUT", `${productPath}${asUser(ADMIN_EMAIL)}`, { price: 79990 });
    expect(asAdmin.status).toBe(200);
    expect(Number(asAdmin.body.price)).toBe(79990);

    const saved = await api("GET", productPath);
    expect(Number(saved.body.price)).toBe(79990);
  });
});