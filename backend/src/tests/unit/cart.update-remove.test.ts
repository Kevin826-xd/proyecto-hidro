import { describe, expect, it } from "vitest";
import { validateQuantity } from "../../services/cart.service";

describe("validateQuantity", () => {
  it("acepta enteros positivos", () => {
    expect(validateQuantity(3)).toBe(3);
  });

  it("rechaza cantidades que no son enteros positivos", () => {
    expect(() => validateQuantity(0)).toThrow("La cantidad debe ser un entero positivo");
    expect(() => validateQuantity(1.5)).toThrow();
    expect(() => validateQuantity(-2)).toThrow();
    expect(() => validateQuantity("2")).toThrow();
  });

  it("permite 0 al actualizar, para quitar el producto del carrito", () => {
    expect(validateQuantity(0, { allowZero: true })).toBe(0);
    expect(() => validateQuantity(-1, { allowZero: true })).toThrow();
  });
});
