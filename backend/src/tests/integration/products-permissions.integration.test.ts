import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { database } from "../../db/connection";
import { api, createApprovedCustomer, loginAsAdmin } from "./helpers/api";

const testId = Date.now();
const customerEmail = `cliente-${testId}@hidrocenter.test`;
const testCategoryName = `Categoría test ${testId}`;
let categoryId = "";
let adminToken = "";
let customerToken = "";

const productData = () => ({
  name: "Bomba de agua test",
  price: 89990,
  stock: 5,
  categoryId,
  diameter: "25",
  material: "Acero",
  workingPressure: "6",
});

beforeAll(async () => {
  adminToken = await loginAsAdmin();
  customerToken = await createApprovedCustomer(customerEmail);

  const category = await api("POST", "/api/categories", {
    name: testCategoryName,
    description: "Creada por las pruebas",
  }, adminToken);
  categoryId = category.body?.id ?? "";
});

afterAll(async () => {
  await database.query("DELETE FROM users WHERE email = $1", [customerEmail]);
  if (categoryId) {
    await database.query("DELETE FROM products WHERE category_id = $1", [categoryId]);
    await database.query("DELETE FROM categories WHERE id = $1", [categoryId]);
  }
  await database.end();
});

describe("Permisos de administración del catálogo", () => {
  it("solo un administrador puede crear productos", async () => {
    expect((await api("POST", "/api/products", productData())).status).toBe(401);
    expect((await api("POST", "/api/products", productData(), customerToken)).status).toBe(403);
    expect((await api("POST", "/api/products", productData(), adminToken)).status).toBe(201);
  });

  it("solo un administrador puede actualizar un producto", async () => {
    const product = await api("POST", "/api/products", productData(), adminToken);
    const productPath = `/api/products/${product.body.id}`;

    expect((await api("PUT", productPath, { price: 79990 })).status).toBe(401);
    expect((await api("PUT", productPath, { price: 79990 }, customerToken)).status).toBe(403);

    const asAdmin = await api("PUT", productPath, { price: 79990 }, adminToken);
    expect(asAdmin.status).toBe(200);

    const saved = await api("GET", productPath);
    expect(Number(saved.body.price)).toBe(79990);
  });

  it("solo un administrador puede eliminar un producto", async () => {
    const product = await api("POST", "/api/products", productData(), adminToken);
    const productPath = `/api/products/${product.body.id}`;

    expect((await api("DELETE", productPath)).status).toBe(401);
    expect((await api("DELETE", productPath, undefined, customerToken)).status).toBe(403);
    expect((await api("DELETE", productPath, undefined, adminToken)).status).toBe(204);
  });

  it("solo un administrador puede crear categorías", async () => {
    const category = { name: `Otra categoría ${testId}` };

    expect((await api("POST", "/api/categories", category)).status).toBe(401);
    expect((await api("POST", "/api/categories", category, customerToken)).status).toBe(403);
  });

  it("rechaza un token falso o modificado", async () => {
    const forged = `${customerToken.slice(0, -4)}abcd`;

    expect((await api("POST", "/api/products", productData(), forged)).status).toBe(401);
    expect((await api("GET", "/api/cart?userId=admin@hidrocenter.cl")).status).toBe(401);
  });
});

describe("Imagen y validación al editar productos", () => {
  it("guarda la imagen del producto en la base de datos", async () => {
    const product = await api("POST", "/api/products", { ...productData(), imageUrl: "images/products/bomba.png" }, adminToken);

    expect(product.status).toBe(201);
    expect(product.body.imageUrl).toBe("images/products/bomba.png");
  });

  it("rechaza una imagen que no es una URL o ruta válida", async () => {
    const product = await api("POST", "/api/products", { ...productData(), imageUrl: "javascript:alert(1)" }, adminToken);

    expect(product.status).toBe(400);
  });

  it("valida los datos al editar, no solo al crear", async () => {
    const product = await api("POST", "/api/products", productData(), adminToken);
    const result = await api("PUT", `/api/products/${product.body.id}`, { price: -5 }, adminToken);

    expect(result.status).toBe(400);
    expect(result.body.message).toBe("El precio debe ser mayor que cero");
  });
});
