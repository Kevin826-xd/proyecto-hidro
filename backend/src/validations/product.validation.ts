import { CreateProductInput, UpdateProductInput } from "../entities/product.entity";
import { ValidationError } from "../errors/http-errors";
import { readObject, readText } from "./common.validation";

// Imagen del producto: una URL web o una ruta dentro de images/ del frontend, sin espacios ni comillas.
const IMAGE_URL_PATTERN = /^(https?:\/\/[^\s"'<>]+|\/?images\/[^\s"'<>]+)$/;

// Mismo largo que las columnas de la tabla products, para responder un mensaje claro en vez de un error de PostgreSQL.
const MAX_NAME_LENGTH = 255;
const MAX_DETAIL_LENGTH = 100;

function validateLength(value: string | undefined, max: number, label: string): void {
  if (value !== undefined && value.length > max) {
    throw new ValidationError(`${label} puede tener como máximo ${max} caracteres`);
  }
}

function validateDetailLengths(fields: { name?: string; material?: string; diameter?: string; workingPressure?: string }): void {
  validateLength(fields.name, MAX_NAME_LENGTH, "El nombre del producto");
  validateLength(fields.material, MAX_DETAIL_LENGTH, "El material");
  validateLength(fields.diameter, MAX_DETAIL_LENGTH, "El diámetro");
  validateLength(fields.workingPressure, MAX_DETAIL_LENGTH, "La presión");
}

function validatePositiveNumberText(value: string | undefined, message: string): void {
  if (value !== undefined && value !== "" && (Number.isNaN(Number(value)) || Number(value) <= 0)) {
    throw new ValidationError(message);
  }
}

function validatePrice(price: unknown): number {
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
    throw new ValidationError("El precio debe ser mayor que cero");
  }
  return price;
}

function validateStock(stock: unknown): number {
  if (typeof stock !== "number" || !Number.isInteger(stock) || stock < 0) {
    throw new ValidationError("El stock no puede ser negativo");
  }
  return stock;
}

function validateImageUrl(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;

  const imageUrl = typeof value === "string" ? value.trim() : "";
  if (imageUrl.length > 500 || !IMAGE_URL_PATTERN.test(imageUrl)) {
    throw new ValidationError("La imagen debe ser una URL válida o una ruta dentro de images/");
  }
  return imageUrl;
}

export function validateProductInput(input: unknown): CreateProductInput {
  const data = readObject(input, "Los datos del producto son obligatorios");
  const name = readText(data.name) ?? "";
  const categoryId = readText(data.categoryId) ?? "";
  const diameter = readText(data.diameter);
  const workingPressure = readText(data.workingPressure);

  if (!name) {
    throw new ValidationError("El nombre del producto es obligatorio");
  }

  if (!categoryId) {
    throw new ValidationError("La categoría es obligatoria");
  }

  const price = validatePrice(data.price);
  const stock = validateStock(data.stock);
  validatePositiveNumberText(diameter, "El diámetro debe ser un número positivo");
  validatePositiveNumberText(workingPressure, "La presión debe ser un número positivo");
  const material = readText(data.material);
  validateDetailLengths({ name, material, diameter, workingPressure });

  return {
    name,
    description: readText(data.description),
    price,
    stock,
    categoryId,
    diameter,
    material,
    workingPressure,
    imageUrl: validateImageUrl(data.imageUrl),
  };
}

// Al editar se pueden enviar solo algunos campos, pero los que lleguen se validan igual que al crear.
export function validateProductUpdateInput(input: unknown): UpdateProductInput {
  const data = readObject(input, "Los datos del producto son obligatorios");
  const update: UpdateProductInput = {};

  if ("name" in data) {
    const name = readText(data.name);
    if (!name) throw new ValidationError("El nombre del producto es obligatorio");
    update.name = name;
  }
  if ("categoryId" in data) {
    const categoryId = readText(data.categoryId);
    if (!categoryId) throw new ValidationError("La categoría es obligatoria");
    update.categoryId = categoryId;
  }
  if ("price" in data) update.price = validatePrice(data.price);
  if ("stock" in data) update.stock = validateStock(data.stock);
  if ("description" in data) update.description = readText(data.description);
  if ("material" in data) update.material = readText(data.material);
  if ("diameter" in data) {
    update.diameter = readText(data.diameter);
    validatePositiveNumberText(update.diameter, "El diámetro debe ser un número positivo");
  }
  if ("workingPressure" in data) {
    update.workingPressure = readText(data.workingPressure);
    validatePositiveNumberText(update.workingPressure, "La presión debe ser un número positivo");
  }
  if ("imageUrl" in data) update.imageUrl = validateImageUrl(data.imageUrl);
  validateDetailLengths(update);

  return update;
}
