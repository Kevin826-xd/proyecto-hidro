import { CreateQuoteInput } from "../entities/quote.entity";
import { ValidationError } from "../errors/http-errors";
import { isUuid } from "../utils/uuid";
import { readObject, readText } from "./common.validation";

// Mismos límites que las columnas de la tabla quotes.
const MAX_NAME_LENGTH = 255;
const MAX_PHONE_LENGTH = 30;
// Un celular chileno tiene 9 dígitos (11 con el +56); 15 es el máximo internacional.
const MIN_PHONE_DIGITS = 8;
const MAX_PHONE_DIGITS = 15;
const MAX_NOTES_LENGTH = 1000;
const MAX_ITEMS = 50;
const MAX_QUANTITY = 9999;
// Misma regla que el registro de usuarios.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function checkLength(value: string | undefined, max: number, label: string): void {
  if (value !== undefined && value.length > max) {
    throw new ValidationError(`${label} puede tener como máximo ${max} caracteres`);
  }
}

// Dígito verificador del RUT chileno (módulo 11).
function rutCheckDigit(body: string): string {
  let sum = 0;
  let factor = 2;
  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const digit = 11 - (sum % 11);
  return digit === 11 ? "0" : digit === 10 ? "K" : String(digit);
}

// Acepta "12.345.678-5", "12345678-5" o "123456785" y lo devuelve como "12.345.678-5".
// Devuelve null si el formato o el dígito verificador no son válidos.
export function normalizeRut(value: string): string | null {
  const clean = value.replace(/[.\s-]/g, "").toUpperCase();
  if (!/^\d{7,8}[\dK]$/.test(clean)) return null;

  const body = clean.slice(0, -1);
  const checkDigit = clean.slice(-1);
  if (rutCheckDigit(body) !== checkDigit) return null;

  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${checkDigit}`;
}

// Junta las cantidades si el mismo producto viene repetido.
function readItems(value: unknown): CreateQuoteInput["items"] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ValidationError("Agrega al menos un producto a la cotización");
  }

  const quantities = new Map<string, number>();
  for (const item of value) {
    const data = readObject(item, "Los productos de la cotización no son válidos");
    const productId = readText(data.productId) ?? "";
    const quantity = data.quantity;

    if (!isUuid(productId)) {
      throw new ValidationError("Los productos de la cotización no son válidos");
    }
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      throw new ValidationError(`La cantidad de cada producto debe ser un entero entre 1 y ${MAX_QUANTITY}`);
    }
    quantities.set(productId, Math.min((quantities.get(productId) ?? 0) + quantity, MAX_QUANTITY));
  }

  if (quantities.size > MAX_ITEMS) {
    throw new ValidationError(`Una cotización puede tener como máximo ${MAX_ITEMS} productos distintos`);
  }

  return [...quantities].map(([productId, quantity]) => ({ productId, quantity }));
}

export function validateQuoteInput(input: unknown): CreateQuoteInput {
  const data = readObject(input, "Los datos de la cotización son obligatorios");
  const customerName = readText(data.customerName) ?? "";
  const customerEmail = (readText(data.customerEmail) ?? "").toLowerCase();
  const customerPhone = readText(data.customerPhone) ?? "";
  const companyName = readText(data.companyName) || undefined;
  const rutText = readText(data.companyRut) || undefined;
  const notes = readText(data.notes) || undefined;

  if (!customerName) {
    throw new ValidationError("El nombre es obligatorio");
  }
  if (!EMAIL_PATTERN.test(customerEmail)) {
    throw new ValidationError("Ingresa un email válido");
  }
  // El teléfono es obligatorio para poder contactar al cliente por la cotización.
  // Se cuentan solo los dígitos: "+56 9 1234 5678" tiene 11.
  const phoneDigits = customerPhone.replace(/\D/g, "").length;
  if (!customerPhone) {
    throw new ValidationError("El teléfono es obligatorio");
  }
  if (!/^[\d\s+()-]+$/.test(customerPhone)) {
    throw new ValidationError("El teléfono solo puede tener números, espacios y los signos + ( ) -");
  }
  if (phoneDigits < MIN_PHONE_DIGITS || phoneDigits > MAX_PHONE_DIGITS) {
    throw new ValidationError(`El teléfono debe tener entre ${MIN_PHONE_DIGITS} y ${MAX_PHONE_DIGITS} dígitos`);
  }

  const companyRut = rutText ? normalizeRut(rutText) : undefined;
  if (companyRut === null) {
    throw new ValidationError("El RUT no es válido. Revisa el número y el dígito verificador");
  }

  checkLength(customerName, MAX_NAME_LENGTH, "El nombre");
  checkLength(customerEmail, MAX_NAME_LENGTH, "El email");
  checkLength(customerPhone, MAX_PHONE_LENGTH, "El teléfono");
  checkLength(companyName, MAX_NAME_LENGTH, "El nombre de la empresa");
  checkLength(notes, MAX_NOTES_LENGTH, "El comentario");

  return {
    customerName,
    customerEmail,
    customerPhone,
    companyName,
    companyRut,
    notes,
    items: readItems(data.items),
  };
}
