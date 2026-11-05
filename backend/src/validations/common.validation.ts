import { ValidationError } from "../errors/http-errors";

// Funciones compartidas por las validaciones de productos y categorías.

export function readObject(input: unknown, message: string): Record<string, unknown> {
  if (!input || typeof input !== "object") {
    throw new ValidationError(message);
  }
  return input as Record<string, unknown>;
}

export function readText(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() : undefined;
}
