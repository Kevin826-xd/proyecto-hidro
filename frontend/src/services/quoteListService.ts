import { QUOTE_LIST_KEY } from "../config/constants";
import type { Product, QuoteListItem } from "../types/api";

// Lista de productos que el cliente quiere cotizar. Vive en el navegador (no necesita sesión)
// hasta que la envía; se guarda en localStorage para no perderla al recargar la página.

export const QUOTE_LIST_CHANGED_EVENT = "quote-list-changed";
export const MAX_QUOTE_QUANTITY = 9999;

function isQuoteListItem(item: unknown): item is QuoteListItem {
  if (!item || typeof item !== "object") return false;
  const data = item as Record<string, unknown>;
  return typeof data.productId === "string" && typeof data.name === "string"
    && Number.isInteger(data.quantity) && Number(data.quantity) > 0;
}

export function readQuoteList(): QuoteListItem[] {
  try {
    const items: unknown = JSON.parse(window.localStorage.getItem(QUOTE_LIST_KEY) ?? "[]");
    return Array.isArray(items) ? items.filter(isQuoteListItem) : [];
  } catch {
    return [];
  }
}

// Avisa a la página (contador del encabezado, enlaces "Ver cotización") que la lista cambió.
function saveQuoteList(items: QuoteListItem[]): void {
  try {
    window.localStorage.setItem(QUOTE_LIST_KEY, JSON.stringify(items));
  } catch {
    // Sin almacenamiento la lista solo dura mientras la página esté abierta.
  }
  window.dispatchEvent(new Event(QUOTE_LIST_CHANGED_EVENT));
}

function clampQuantity(quantity: number): number {
  return Math.min(Math.max(Math.trunc(quantity), 1), MAX_QUOTE_QUANTITY);
}

// Si el producto ya está en la lista, suma la cantidad.
export function addToQuoteList(product: Product, quantity: number): QuoteListItem[] {
  const items = readQuoteList();
  const existing = items.find((item) => item.productId === product.id);
  const next = existing
    ? items.map((item) => (item === existing ? { ...item, quantity: clampQuantity(item.quantity + quantity) } : item))
    : [...items, { productId: product.id, name: product.name, price: Number(product.price), stock: Number(product.stock), quantity: clampQuantity(quantity) }];
  saveQuoteList(next);
  return next;
}

export function setQuoteQuantity(productId: string, quantity: number): QuoteListItem[] {
  const next = readQuoteList().map((item) => (item.productId === productId ? { ...item, quantity: clampQuantity(quantity) } : item));
  saveQuoteList(next);
  return next;
}

export function removeFromQuoteList(productId: string): QuoteListItem[] {
  const next = readQuoteList().filter((item) => item.productId !== productId);
  saveQuoteList(next);
  return next;
}

export function clearQuoteList(): void {
  saveQuoteList([]);
}

export function isInQuoteList(productId: string): boolean {
  return readQuoteList().some((item) => item.productId === productId);
}

export function countQuoteItems(): number {
  return readQuoteList().length;
}
