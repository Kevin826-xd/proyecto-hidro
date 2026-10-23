import { apiRequest } from "./apiClient.js";

const ADMIN_ERROR = "No se pudo completar la operación de administrador.";

export function getAdminReservations() {
  return apiRequest("/api/cart/admin/reservations", { errorMessage: ADMIN_ERROR });
}

export function getAdminProducts() {
  return apiRequest("/api/products", { errorMessage: "No se pudieron cargar los productos." });
}

export function updateAdminProduct(productId, payload) {
  return apiRequest(`/api/products/${encodeURIComponent(productId)}`, {
    method: "PUT",
    body: payload,
    errorMessage: ADMIN_ERROR,
  });
}
