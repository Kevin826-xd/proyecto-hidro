import { apiRequest } from "./apiClient.js";

export function getCart() {
  return apiRequest("/api/cart", { errorMessage: "No se pudo cargar el carrito." });
}

export function getReservedDeliveryDates() {
  return apiRequest("/api/cart/reserved-dates", { errorMessage: "No se pudieron cargar los días reservados." });
}

export function getShippingQuote({ lat, lng }, signal) {
  const query = new URLSearchParams({ lat, lng });
  return apiRequest(`/api/cart/shipping-quote?${query}`, { signal, errorMessage: "No se pudo calcular el costo del despacho." });
}

// Solo se envía el producto y la cantidad: el backend usa el precio de la base de datos.
export function addCartItem(productId, quantity = 1) {
  return apiRequest("/api/cart/items", {
    method: "POST",
    body: { productId, quantity },
    errorMessage: "No se pudo agregar el producto al carrito.",
  });
}

export function updateCartItemQuantity(productId, quantity) {
  return apiRequest(`/api/cart/items/${encodeURIComponent(productId)}`, {
    method: "PUT",
    body: { quantity },
    errorMessage: "No se pudo actualizar el carrito.",
  });
}

export function removeCartItem(productId) {
  return apiRequest(`/api/cart/items/${encodeURIComponent(productId)}`, {
    method: "DELETE",
    errorMessage: "No se pudo quitar el producto del carrito.",
  });
}

export function updateCartDeliveryDate(deliveryDate, location) {
  return apiRequest("/api/cart/delivery-date", {
    method: "PUT",
    body: { deliveryDate, ...location },
    errorMessage: "No se pudo reservar el día de despacho.",
  });
}

export function removeCartDeliveryReservation(deliveryDate) {
  return apiRequest(`/api/cart/delivery-date/${encodeURIComponent(deliveryDate)}`, {
    method: "DELETE",
    errorMessage: "No se pudo eliminar el despacho.",
  });
}

export function editCartDeliveryReservation(originalDate, deliveryDate, location) {
  return apiRequest(`/api/cart/delivery-date/${encodeURIComponent(originalDate)}`, {
    method: "PUT",
    body: { deliveryDate, ...location },
    errorMessage: "No se pudo editar el despacho.",
  });
}
