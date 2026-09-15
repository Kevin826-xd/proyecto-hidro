import { CreateCategoryInput } from "../entities/category.entity";
import { CreateProductInput } from "../entities/product.entity";

export function validateCategoryInput(input: unknown): CreateCategoryInput {
  if (!input || typeof input !== "object") {
    throw new Error("Los datos de la categoría son obligatorios");
  }

  const data = input as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const description = typeof data.description === "string" ? data.description.trim() : undefined;

  if (!name) {
    throw new Error("El nombre de la categoría es obligatorio");
  }

  return { name, description };
}

export function validateProductInput(input: unknown): CreateProductInput {
  if (!input || typeof input !== "object") {
    throw new Error("Los datos del producto son obligatorios");
  }

  const data = input as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const categoryId = typeof data.categoryId === "string" ? data.categoryId.trim() : "";
  const description = typeof data.description === "string" ? data.description.trim() : undefined;
  const diameter = typeof data.diameter === "string" ? data.diameter.trim() : undefined;
  const material = typeof data.material === "string" ? data.material.trim() : undefined;
  const workingPressure = typeof data.workingPressure === "string" ? data.workingPressure.trim() : undefined;

  if (!name) {
    throw new Error("El nombre del producto es obligatorio");
  }

  if (!categoryId) {
    throw new Error("La categoría es obligatoria");
  }

  if (typeof data.price !== "number" || !Number.isFinite(data.price) || data.price <= 0) {
    throw new Error("El precio debe ser mayor que cero");
  }

  if (typeof data.stock !== "number" || !Number.isInteger(data.stock) || data.stock < 0) {
    throw new Error("El stock no puede ser negativo");
  }

  if (diameter !== undefined && diameter !== "" && (Number.isNaN(Number(diameter)) || Number(diameter) <= 0)) {
    throw new Error("El diámetro debe ser un número positivo");
  }

  if (workingPressure !== undefined && workingPressure !== "" && (Number.isNaN(Number(workingPressure)) || Number(workingPressure) <= 0)) {
    throw new Error("La presión debe ser un número positivo");
  }

  return {
    name,
    description,
    price: data.price,
    stock: data.stock,
    categoryId,
    diameter,
    material,
    workingPressure,
  };
}
