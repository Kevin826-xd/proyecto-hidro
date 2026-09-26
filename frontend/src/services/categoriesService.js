import { API_ORIGIN } from "../config/api.js";

export async function getCategories() {
  const response = await fetch(`${API_ORIGIN}/api/categories`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("No se pudo cargar la lista de categorías.");
  }

  return response.json();
}