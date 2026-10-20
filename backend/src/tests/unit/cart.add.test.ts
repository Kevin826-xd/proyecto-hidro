import { describe, expect, it } from "vitest";
import { addItemToCart } from "../../services/cart.service";

describe("addItemToCart", () => {
  it("agrega un producto y calcula el total", () => {
    const cart = addItemToCart("usuario-1", { productId: "p1", name: "Válvula", price: 2500 }, 3);

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].subtotal).toBe(7500);
    expect(cart.total).toBe(7500);
  });

  it("suma la cantidad si el producto ya está en el carrito", () => {
    addItemToCart("usuario-2", { productId: "p1", name: "Válvula", price: 2500 }, 1);
    const cart = addItemToCart("usuario-2", { productId: "p1", name: "Válvula", price: 2500 }, 2);

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(3);
    expect(cart.total).toBe(7500);
  });

  it("rechaza cantidades que no son enteros positivos", () => {
    expect(() => addItemToCart("usuario-3", { productId: "p1", name: "Válvula", price: 2500 }, 0)).toThrow();
    expect(() => addItemToCart("usuario-3", { productId: "p1", name: "Válvula", price: 2500 }, 1.5)).toThrow();
  });
});