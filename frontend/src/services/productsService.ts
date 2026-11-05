import { API_ORIGIN } from "../config/api";
import type { Product } from "../types/api";

export async function getProducts(): Promise<Product[]> {
  const response = await fetch(`${API_ORIGIN}/api/products`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("No se pudo cargar la lista de productos.");
  }

  return response.json();
}
