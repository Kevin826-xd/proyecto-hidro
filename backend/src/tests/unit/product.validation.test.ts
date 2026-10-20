import { describe, expect, it } from "vitest";
import { validateProductInput } from "../../validations/catalog.validation";

const validProduct = {
  name: "Tubería PVC",
  price: 4990,
  stock: 10,
  categoryId: "categoria-1",
  diameter: "32",
  material: "PVC",
  workingPressure: "10",
};

describe("validateProductInput", () => {
  it("acepta un producto válido", () => {
    expect(validateProductInput(validProduct)).toMatchObject({ name: "Tubería PVC", price: 4990, stock: 10 });
  });

  it("rechaza un precio igual o menor a cero", () => {
    expect(() => validateProductInput({ ...validProduct, price: 0 })).toThrow("El precio debe ser mayor que cero");
  });

  it("rechaza stock negativo o con decimales", () => {
    expect(() => validateProductInput({ ...validProduct, stock: -1 })).toThrow("El stock no puede ser negativo");
    expect(() => validateProductInput({ ...validProduct, stock: 1.5 })).toThrow("El stock no puede ser negativo");
  });

  it("rechaza un diámetro que no es un número positivo", () => {
    expect(() => validateProductInput({ ...validProduct, diameter: "abc" })).toThrow("El diámetro debe ser un número positivo");
  });
});