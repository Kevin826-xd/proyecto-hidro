async function getProducts() {
  const response = await fetch("/api/products", {
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
async function getCart(userId) {
  const url = new URL("/api/cart", window.location.origin);
  if (userId) {
    url.searchParams.set("userId", userId);
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("No se pudo cargar el carrito.");
  }

  return response.json();
}

async function getReservedDeliveryDates() {
  const response = await fetch("/api/cart/reserved-dates", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("No se pudieron cargar los días reservados.");
  }

  return response.json();
}

async function addCartItem(payload, userId) {
  const url = new URL("/api/cart/items", window.location.origin);
  if (userId) {
    url.searchParams.set("userId", userId);
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "No se pudo agregar el producto al carrito.");
  }

  return response.json();
}

async function updateCartItemQuantity(productId, quantity, userId) {
  const url = new URL(`/api/cart/items/${productId}`, window.location.origin);
  if (userId) {
    url.searchParams.set("userId", userId);
  }

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ quantity }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "No se pudo actualizar el carrito.");
  }

  return response.json();
}

async function removeCartItem(productId, userId) {
  const url = new URL(`/api/cart/items/${productId}`, window.location.origin);
  if (userId) {
    url.searchParams.set("userId", userId);
  }

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "No se pudo quitar el producto del carrito.");
  }

  return response.json();
}

async function updateCartDeliveryDate(deliveryDate, deliveryCity, deliveryAddress, userId) {
  const url = new URL("/api/cart/delivery-date", window.location.origin);
  if (userId) {
    url.searchParams.set("userId", userId);
  }

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ deliveryDate, deliveryCity, deliveryAddress }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "No se pudo reservar el día de despacho.");
  }

  return response.json();
}
