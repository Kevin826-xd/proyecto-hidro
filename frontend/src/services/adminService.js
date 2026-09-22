const API_ORIGIN = window.location.port === "3000" || window.location.port === ""
  ? ""
  : "http://localhost:3000";

async function request(path, userId, options = {}) {
  const url = new URL(`${API_ORIGIN}${path}`, window.location.origin);
  url.searchParams.set("userId", userId);
  const response = await fetch(url, {
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "No se pudo completar la operación de administrador.");
  }
  return data;
}

export function getAdminReservations(userId) {
  return request("/api/cart/admin/reservations", userId);
}

export function getAdminProducts() {
  const url = `${API_ORIGIN}/api/products`;
  return fetch(url, { headers: { Accept: "application/json" } }).then(async (response) => {
    if (!response.ok) throw new Error("No se pudieron cargar los productos.");
    return response.json();
  });
}

export function updateAdminProduct(productId, payload, userId) {
  return request(`/api/products/${productId}`, userId, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
