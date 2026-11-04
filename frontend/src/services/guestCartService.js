import { GUEST_CART_KEY } from "../config/constants.js";

// Carrito de un visitante sin sesión: vive en el navegador y se pasa al servidor al iniciar sesión.
export function readGuestCart() {
  try {
    const items = JSON.parse(window.localStorage.getItem(GUEST_CART_KEY) ?? "[]");
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export function saveGuestCart(items) {
  try {
    window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch {
    // Sin almacenamiento disponible el carrito solo dura mientras la página esté abierta.
  }
}

export function clearGuestCart() {
  try {
    window.localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    // Nada que limpiar.
  }
}
