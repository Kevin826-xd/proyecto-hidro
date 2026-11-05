import { GUEST_CART_KEY } from "../config/constants";
import type { CartItem } from "../types/api";

// Carrito de un visitante sin sesión: vive en el navegador y se pasa al servidor al iniciar sesión.
// Lo guardado en localStorage lo puede modificar cualquiera, por eso se descarta lo que no sea un objeto.
export function readGuestCart(): CartItem[] {
  try {
    const items: unknown = JSON.parse(window.localStorage.getItem(GUEST_CART_KEY) ?? "[]");
    return Array.isArray(items) ? items.filter((item): item is CartItem => Boolean(item) && typeof item === "object") : [];
  } catch {
    return [];
  }
}

export function saveGuestCart(items: CartItem[]): void {
  try {
    window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch {
    // Sin almacenamiento disponible el carrito solo dura mientras la página esté abierta.
  }
}

export function clearGuestCart(): void {
  try {
    window.localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    // Nada que limpiar.
  }
}
