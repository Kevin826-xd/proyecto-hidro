import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { database } from "../../utils/database";
import { api, asUser } from "./helpers/api";

const customerEmail = `cliente-carrito-${Date.now()}@hidrocenter.test`;

beforeAll(async () => {
  await api("POST", "/api/users/register", {
    name: "Cliente Carrito Test",
    email: customerEmail,
    password: "secreto123",
  });
});

afterAll(async () => {
  await database.query("DELETE FROM users WHERE email = $1", [customerEmail]);
  await database.end();
});

describe("Modificar el carrito", () => {
  it("actualiza la cantidad de un producto y luego elimina otro", async () => {
    const userQuery = asUser(customerEmail);

    await api("POST", `/api/cart/items${userQuery}`, { productId: "p1", name: "Codo PVC", price: 800, quantity: 1 });
    await api("POST", `/api/cart/items${userQuery}`, { productId: "p2", name: "Llave de paso", price: 5000, quantity: 1 });

    const updated = await api("PUT", `/api/cart/items/p1${userQuery}`, { quantity: 5 });

    expect(updated.status).toBe(200);
    expect(updated.body.total).toBe(9000);

    const removed = await api("DELETE", `/api/cart/items/p2${userQuery}`);

    expect(removed.status).toBe(200);
    expect(removed.body.items).toHaveLength(1);
    expect(removed.body.total).toBe(4000);
  });
});