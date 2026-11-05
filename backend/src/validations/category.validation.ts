import { CreateCategoryInput } from "../entities/category.entity";
import { ValidationError } from "../errors/http-errors";
import { readObject, readText } from "./common.validation";

export function validateCategoryInput(input: unknown): CreateCategoryInput {
  const data = readObject(input, "Los datos de la categoría son obligatorios");
  const name = readText(data.name) ?? "";

  if (!name) {
    throw new ValidationError("El nombre de la categoría es obligatorio");
  }

  return { name, description: readText(data.description) };
}
