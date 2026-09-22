const API_ORIGIN = window.location.port === "3000" || window.location.port === ""
  ? ""
  : "http://localhost:3000";

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
