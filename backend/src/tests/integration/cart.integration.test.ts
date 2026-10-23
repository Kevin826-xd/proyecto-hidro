import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { database } from "../../db/connection";
import { api, createApprovedCustomer, loginAsAdmin } from "./helpers/api";

const testId = Date.now();
const customerEmail = `cliente-carrito-${testId}@hidrocenter.test`;
let customerToken = "";
let categoryId = "";
let elbowId = "";
let valveId = "";

beforeAll(async () => {
  const adminToken = await loginAsAdmin();
  customerToken = await createApprovedCustomer(customerEmail);

  const category = await api("POST", "/api/categories", { name: `Carrito test ${testId}` }, adminToken);
  categoryId = category.body.id;

  const elbow = await api("POST", "/api/products", { name: "Codo PVC", price: 800, stock: 10, categoryId }, adminToken);
  const valve = await api("POST", "/api/products", { name: "Llave de paso", price: 5000, stock: 3, categoryId }, adminToken);
  elbowId = elbow.body.id;
  valveId = valve.body.id;
});

afterAll(async () => {
  await database.query("DELETE FROM users WHERE email = $1", [customerEmail]);
  await database.query("DELETE FROM products WHERE category_id = $1", [categoryId]);
  await database.query("DELETE FROM categories WHERE id = $1", [categoryId]);
  await database.end();
});

describe("Carrito de compras", () => {
  it("exige iniciar sesión", async () => {
    expect((await api("GET", "/api/cart")).status).toBe(401);
  });

  it("usa el precio de la base de datos aunque el navegador envíe otro", async () => {
    const added = await api("POST", "/api/cart/items", { productId: valveId, quantity: 1, price: 1 }, customerToken);

    expect(added.status).toBe(201);
    expect(added.body.items[0].price).toBe(5000);
    expect(added.body.total).toBe(5000);
  });

  it("actualiza la cantidad de un producto y luego elimina otro", async () => {
    await api("POST", "/api/cart/items", { productId: elbowId, quantity: 1 }, customerToken);

    const updated = await api("PUT", `/api/cart/items/${elbowId}`, { quantity: 5 }, customerToken);
    expect(updated.status).toBe(200);
    expect(updated.body.total).toBe(9000);

    const removed = await api("DELETE", `/api/cart/items/${valveId}`, undefined, customerToken);
    expect(removed.status).toBe(200);
    expect(removed.body.items).toHaveLength(1);
    expect(removed.body.total).toBe(4000);
  });

  it("guarda el carrito en la base de datos", async () => {
    const cart = await api("GET", "/api/cart", undefined, customerToken);

    expect(cart.body.items).toEqual([expect.objectContaining({ productId: elbowId, quantity: 5 })]);
  });

  it("no permite agregar más unidades que el stock disponible", async () => {
    const result = await api("POST", "/api/cart/items", { productId: valveId, quantity: 4 }, customerToken);

    expect(result.status).toBe(400);
    expect(result.body.message).toBe("Solo quedan 3 unidades disponibles");
  });

  it("responde 404 si el producto no existe", async () => {
    const result = await api("POST", "/api/cart/items", { productId: "no-existe", quantity: 1 }, customerToken);

    expect(result.status).toBe(404);
  });
});
