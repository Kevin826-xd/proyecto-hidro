import { CreateCategoryInput } from "../entities/category.entity";
import { ValidationError } from "../errors/http-errors";
import { readObject, readText } from "./common.validation";

// Mismo largo que las columnas VARCHAR(255) de la tabla categories.
const MAX_NAME_LENGTH = 255;

export function validateCategoryInput(input: unknown): CreateCategoryInput {
  const data = readObject(input, "Los datos de la categoría son obligatorios");
  const name = readText(data.name) ?? "";
  // Un grupo vacío significa "categoría suelta".
  const groupName = readText(data.groupName) || undefined;

  if (!name) {
    throw new ValidationError("El nombre de la categoría es obligatorio");
  }

  if (name.length > MAX_NAME_LENGTH || (groupName?.length ?? 0) > MAX_NAME_LENGTH) {
    throw new ValidationError(`El nombre y el grupo pueden tener como máximo ${MAX_NAME_LENGTH} caracteres`);
  }

  return { name, description: readText(data.description), groupName };
}
