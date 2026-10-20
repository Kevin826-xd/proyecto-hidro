import { describe, expect, it } from "vitest";
import { addItemToCart, removeItemFromCart, updateCartItemQuantity } from "../../services/cart.service";

describe("updateCartItemQuantity y removeItemFromCart", () => {
  it("actualiza la cantidad y recalcula el total", () => {
    addItemToCart("usuario-4", { productId: "p1", name: "Válvula", price: 2500 }, 1);
    const cart = updateCartItemQuantity("usuario-4", "p1", 4);

    expect(cart.items[0].quantity).toBe(4);
    expect(cart.total).toBe(10000);
  });

  it("elimina el producto si la cantidad es 0", () => {
    addItemToCart("usuario-5", { productId: "p1", name: "Válvula", price: 2500 }, 2);
    const cart = updateCartItemQuantity("usuario-5", "p1", 0);

    expect(cart.items).toHaveLength(0);
    expect(cart.total).toBe(0);
  });

  it("lanza un error si el producto no está en el carrito", () => {
    expect(() => updateCartItemQuantity("usuario-6", "no-existe", 2)).toThrow("Producto no encontrado en el carrito");
  });

  it("removeItemFromCart quita solo el producto indicado", () => {
    addItemToCart("usuario-7", { productId: "p1", name: "Válvula", price: 2500 }, 1);
    addItemToCart("usuario-7", { productId: "p2", name: "Codo", price: 800 }, 2);
    const cart = removeItemFromCart("usuario-7", "p1");

    expect(cart.items.map((item) => item.productId)).toEqual(["p2"]);
    expect(cart.total).toBe(1600);
  });
});