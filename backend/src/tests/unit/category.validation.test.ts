import { describe, expect, it } from "vitest";
import { validateCategoryInput } from "../../validations/category.validation";

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

  it("acepta un grupo y le quita los espacios", () => {
    expect(validateCategoryInput({ name: "Centrífugas", groupName: "  Bombas " })).toEqual({
      name: "Centrífugas",
      groupName: "Bombas",
    });
  });

  it("un grupo vacío deja la categoría suelta", () => {
    expect(validateCategoryInput({ name: "Válvulas", groupName: "   " }).groupName).toBeUndefined();
  });

  it("rechaza nombres más largos que la columna de la base de datos", () => {
    expect(() => validateCategoryInput({ name: "a".repeat(256) })).toThrow("como máximo 255 caracteres");
    expect(() => validateCategoryInput({ name: "Válvulas", groupName: "a".repeat(256) })).toThrow("como máximo 255 caracteres");
  });
});