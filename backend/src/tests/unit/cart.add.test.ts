import { describe, expect, it } from "vitest";
import { buildCart } from "../../services/cart.service";

describe("buildCart", () => {
  it("calcula el subtotal de cada producto y el total", () => {
    const cart = buildCart("usuario-1", [
      { productId: "p1", name: "Válvula", price: 2500, quantity: 3 },
      { productId: "p2", name: "Codo", price: 800, quantity: 2 },
    ]);

    expect(cart.items.map((item) => item.subtotal)).toEqual([7500, 1600]);
    expect(cart.total).toBe(9100);
  });

  it("convierte a número el precio que PostgreSQL entrega como texto", () => {
    const cart = buildCart("usuario-2", [{ productId: "p1", name: "Gotero", price: "180.50", quantity: 2 }]);

    expect(cart.items[0].price).toBe(180.5);
    expect(cart.total).toBe(361);
  });

  it("devuelve un carrito vacío con total 0", () => {
    const cart = buildCart("usuario-3", []);

    expect(cart.items).toHaveLength(0);
    expect(cart.total).toBe(0);
  });
});
