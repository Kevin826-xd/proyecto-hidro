import type { Cart, CartWithReservations, Coordinates, DeliveryLocationInput, ShippingQuote } from "../types/api";
import { apiRequest } from "./apiClient";

export function getCart(): Promise<CartWithReservations> {
  return apiRequest("/api/cart", { errorMessage: "No se pudo cargar el carrito." });
}

export function getReservedDeliveryDates(): Promise<string[]> {
  return apiRequest("/api/cart/reserved-dates", { errorMessage: "No se pudieron cargar los días reservados." });
}

export function getShippingQuote({ lat, lng }: Coordinates, signal?: AbortSignal): Promise<ShippingQuote> {
  const query = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  return apiRequest(`/api/cart/shipping-quote?${query}`, { signal, errorMessage: "No se pudo calcular el costo del despacho." });
}

// Solo se envía el producto y la cantidad: el backend usa el precio de la base de datos.
export function addCartItem(productId: string, quantity = 1): Promise<Cart> {
  return apiRequest("/api/cart/items", {
    method: "POST",
    body: { productId, quantity },
    errorMessage: "No se pudo agregar el producto al carrito.",
  });
}

export function updateCartItemQuantity(productId: string, quantity: number): Promise<Cart> {
  return apiRequest(`/api/cart/items/${encodeURIComponent(productId)}`, {
    method: "PUT",
    body: { quantity },
    errorMessage: "No se pudo actualizar el carrito.",
  });
}

export function removeCartItem(productId: string): Promise<Cart> {
  return apiRequest(`/api/cart/items/${encodeURIComponent(productId)}`, {
    method: "DELETE",
    errorMessage: "No se pudo quitar el producto del carrito.",
  });
}

export function updateCartDeliveryDate(deliveryDate: string, location: DeliveryLocationInput): Promise<CartWithReservations> {
  return apiRequest("/api/cart/delivery-date", {
    method: "PUT",
    body: { deliveryDate, ...location },
    errorMessage: "No se pudo reservar el día de despacho.",
  });
}

export function removeCartDeliveryReservation(deliveryDate: string): Promise<CartWithReservations> {
  return apiRequest(`/api/cart/delivery-date/${encodeURIComponent(deliveryDate)}`, {
    method: "DELETE",
    errorMessage: "No se pudo eliminar el despacho.",
  });
}

export function editCartDeliveryReservation(originalDate: string, deliveryDate: string, location: DeliveryLocationInput): Promise<CartWithReservations> {
  return apiRequest(`/api/cart/delivery-date/${encodeURIComponent(originalDate)}`, {
    method: "PUT",
    body: { deliveryDate, ...location },
    errorMessage: "No se pudo editar el despacho.",
  });
}
