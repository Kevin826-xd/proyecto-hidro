import { API_ORIGIN } from "../config/api.js";

export async function getProducts() {
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
