import type { AdminReservation, Category, NewCategoryInput, NewProductInput, Product } from "../types/api";
import { apiRequest } from "./apiClient";

const ADMIN_ERROR = "No se pudo completar la operación de administrador.";

export function getAdminReservations(): Promise<AdminReservation[]> {
  return apiRequest("/api/cart/admin/reservations", { errorMessage: ADMIN_ERROR });
}

export function getAdminProducts(): Promise<Product[]> {
  return apiRequest("/api/products", { errorMessage: "No se pudieron cargar los productos." });
}

export function createCategory(input: NewCategoryInput): Promise<Category> {
  return apiRequest("/api/categories", {
    method: "POST",
    body: input,
    errorMessage: "No se pudo crear la categoría.",
  });
}

export function createProduct(input: NewProductInput): Promise<Product> {
  return apiRequest("/api/products", {
    method: "POST",
    body: input,
    errorMessage: "No se pudo crear el producto.",
  });
}

export function updateAdminProduct(productId: string, payload: Pick<Product, "price" | "stock">): Promise<Product> {
  return apiRequest(`/api/products/${encodeURIComponent(productId)}`, {
    method: "PUT",
    body: payload,
    errorMessage: ADMIN_ERROR,
  });
}
