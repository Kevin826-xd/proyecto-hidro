async function parseResponse(response, fallbackMessage) {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || fallbackMessage);
  }
  return response.json();
}

function userUrl(path, userId) {
  const url = new URL(path, window.location.origin);
  if (userId) url.searchParams.set("userId", userId);
  return url;
}

export async function getCart(userId) {
  return parseResponse(await fetch(userUrl("/api/cart", userId), { headers: { Accept: "application/json" } }), "No se pudo cargar el carrito.");
}

export async function getReservedDeliveryDates() {
  return parseResponse(await fetch("/api/cart/reserved-dates", { headers: { Accept: "application/json" } }), "No se pudieron cargar los días reservados.");
}

export async function addCartItem(payload, userId) {
  return parseResponse(await fetch(userUrl("/api/cart/items", userId), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  }), "No se pudo agregar el producto al carrito.");
}

export async function updateCartItemQuantity(productId, quantity, userId) {
  return parseResponse(await fetch(userUrl(`/api/cart/items/${productId}`, userId), {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ quantity }),
  }), "No se pudo actualizar el carrito.");
}

export async function removeCartItem(productId, userId) {
  return parseResponse(await fetch(userUrl(`/api/cart/items/${productId}`, userId), {
    method: "DELETE",
    headers: { Accept: "application/json" },
  }), "No se pudo quitar el producto del carrito.");
}

export async function updateCartDeliveryDate(deliveryDate, deliveryCity, deliveryAddress, userId) {
  return parseResponse(await fetch(userUrl("/api/cart/delivery-date", userId), {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ deliveryDate, deliveryCity, deliveryAddress }),
  }), "No se pudo reservar el día de despacho.");
}