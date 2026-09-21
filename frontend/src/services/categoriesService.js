export async function getCategories() {
  const response = await fetch("/api/categories", {
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