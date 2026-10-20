import { describe, expect, it } from "vitest";
import { validateCategoryInput } from "../../validations/catalog.validation";

describe("validateCategoryInput", () => {
  it("devuelve el nombre y la descripción sin espacios extra", () => {
    expect(validateCategoryInput({ name: "  Válvulas  ", description: " De bola " })).toEqual({
      name: "Válvulas",
      description: "De bola",
    });
  });

  it("lanza un error si no hay nombre", () => {
    expect(() => validateCategoryInput({ name: "   " })).toThrow("El nombre de la categoría es obligatorio");
  });

  it("lanza un error si no se envían datos", () => {
    expect(() => validateCategoryInput(null)).toThrow("Los datos de la categoría son obligatorios");
  });
});