import { CreateCategoryInput } from "../entities/category.entity";
import { CreateProductInput } from "../entities/product.entity";

export function validateCategoryInput(input: unknown): CreateCategoryInput {
  if (!input || typeof input !== "object") {
    throw new Error("Category data is required");
  }

  const data = input as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const description = typeof data.description === "string" ? data.description.trim() : undefined;

  if (!name) {
    throw new Error("Category name is required");
  }

  return { name, description };
}

export function validateProductInput(input: unknown): CreateProductInput {
  if (!input || typeof input !== "object") {
    throw new Error("Product data is required");
  }

  const data = input as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const categoryId = typeof data.categoryId === "string" ? data.categoryId.trim() : "";
  const description = typeof data.description === "string" ? data.description.trim() : undefined;
  const diameter = typeof data.diameter === "string" ? data.diameter.trim() : undefined;
  const material = typeof data.material === "string" ? data.material.trim() : undefined;
  const workingPressure = typeof data.workingPressure === "string" ? data.workingPressure.trim() : undefined;

  if (!name) {
    throw new Error("Product name is required");
  }

  if (!categoryId) {
    throw new Error("Category is required");
  }

  if (typeof data.price !== "number" || !Number.isFinite(data.price) || data.price <= 0) {
    throw new Error("Price must be greater than zero");
  }

  if (typeof data.stock !== "number" || !Number.isInteger(data.stock) || data.stock < 0) {
    throw new Error("Stock must be a non-negative integer");
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
