import { randomUUID } from "node:crypto";
import { Cart, CartItem, DeliveryReservation } from "../entities/cart.entity";

const cartStore = new Map<string, Cart>();

function getCartKey(userId?: string): string {
  return userId ?? "guest";
}

function isValidDeliveryDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const selectedDate = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return !Number.isNaN(selectedDate.getTime()) && selectedDate >= today;
}

function getCartReservations(cart: Cart): DeliveryReservation[] {
  if (cart.deliveryReservations?.length) {
    return cart.deliveryReservations;
  }

  return cart.deliveryDate
    ? [{
        deliveryDate: cart.deliveryDate,
        deliveryCity: cart.deliveryCity,
        deliveryAddress: cart.deliveryAddress,
      }]
    : [];
}

function createCartItem(productId: string, name: string, price: number, quantity: number): CartItem {
  const safeQuantity = Number(quantity);
  const safePrice = Number(price);
  const subtotal = Number((safePrice * safeQuantity).toFixed(2));

  return {
    productId,
    name,
    price: safePrice,
    quantity: safeQuantity,
    subtotal,
  };
}

function calculateCart(items: CartItem[]): Cart {
  const normalizedItems = items.map((item) => ({
    ...item,
    subtotal: Number((item.price * item.quantity).toFixed(2)),
  }));

  const subtotal = Number(
    normalizedItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2),
  );

  return {
    id: randomUUID(),
    items: normalizedItems,
    total: subtotal,
    deliveryReservations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function getCart(userId?: string): Cart {
  const cartKey = getCartKey(userId);
  const existingCart = cartStore.get(cartKey);

  if (existingCart) {
    return existingCart;
  }

  const newCart: Cart = {
    id: randomUUID(),
    userId,
    items: [],
    total: 0,
    deliveryReservations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  cartStore.set(cartKey, newCart);
  return newCart;
}

export function addItemToCart(
  userId: string | undefined,
  product: { productId: string; name: string; price: number },
  quantity: number,
): Cart {
  const cartKey = getCartKey(userId);
  const cart = getCart(userId);
  const safeQuantity = Number(quantity);

  if (!Number.isInteger(safeQuantity) || safeQuantity <= 0) {
    throw new Error("La cantidad debe ser un entero positivo");
  }

  const existingItem = cart.items.find((item) => item.productId === product.productId);
  const nextItems = [...cart.items];

  if (existingItem) {
    const updatedQuantity = existingItem.quantity + safeQuantity;
    nextItems[nextItems.indexOf(existingItem)] = createCartItem(
      product.productId,
      product.name || existingItem.name,
      product.price || existingItem.price,
      updatedQuantity,
    );
  } else {
    nextItems.push(createCartItem(product.productId, product.name, product.price, safeQuantity));
  }

  const updatedCart: Cart = {
    ...cart,
    items: nextItems,
    total: Number(
      nextItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2),
    ),
    updatedAt: new Date().toISOString(),
  };

  cartStore.set(cartKey, updatedCart);
  return updatedCart;
}

export function updateCartItemQuantity(
  userId: string | undefined,
  productId: string,
  quantity: number,
): Cart {
  const cart = getCart(userId);
  const safeQuantity = Number(quantity);

  if (!Number.isInteger(safeQuantity)) {
    throw new Error("La cantidad debe ser un entero");
  }

  const existingItem = cart.items.find((item) => item.productId === productId);

  if (!existingItem) {
    throw new Error("Producto no encontrado en el carrito");
  }

  if (safeQuantity <= 0) {
    return removeItemFromCart(userId, productId);
  }

  const nextItems = cart.items.map((item) =>
    item.productId === productId
      ? createCartItem(item.productId, item.name, item.price, safeQuantity)
      : item,
  );

  const updatedCart: Cart = {
    ...cart,
    items: nextItems,
    total: Number(
      nextItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2),
    ),
    updatedAt: new Date().toISOString(),
  };

  cartStore.set(getCartKey(userId), updatedCart);
  return updatedCart;
}

export function removeItemFromCart(userId: string | undefined, productId: string): Cart {
  const cart = getCart(userId);
  const nextItems = cart.items.filter((item) => item.productId !== productId);
  const updatedCart: Cart = {
    ...cart,
    items: nextItems,
    total: Number(
      nextItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2),
    ),
    updatedAt: new Date().toISOString(),
  };

  cartStore.set(getCartKey(userId), updatedCart);
  return updatedCart;
}

export function updateCartDeliveryDate(
  userId: string | undefined,
  deliveryDate: string,
  deliveryCity?: string,
  deliveryAddress?: string,
): Cart {
  if (!isValidDeliveryDate(deliveryDate)) {
    throw new Error("La fecha de despacho debe ser válida y no puede ser anterior a hoy");
  }

  const normalizedCity = deliveryCity?.trim() ?? "";
  const normalizedAddress = deliveryAddress?.trim() ?? "";

  if ((normalizedCity && !normalizedAddress) || (!normalizedCity && normalizedAddress)) {
    throw new Error("La ciudad y la dirección deben completarse juntas");
  }

  const cart = getCart(userId);
  const dateIsReserved = [...cartStore.values()].some((storedCart) =>
    getCartReservations(storedCart).some((reservation) => reservation.deliveryDate === deliveryDate),
  );

  if (dateIsReserved) {
    throw new Error("Ese día ya está reservado. Selecciona otra fecha disponible");
  }

  const reservation: DeliveryReservation = {
    deliveryDate,
    deliveryCity: normalizedCity || undefined,
    deliveryAddress: normalizedAddress || undefined,
  };
  const updatedCart: Cart = {
    ...cart,
    deliveryDate,
    deliveryCity: normalizedCity || undefined,
    deliveryAddress: normalizedAddress || undefined,
    deliveryReservations: [...getCartReservations(cart), reservation],
    updatedAt: new Date().toISOString(),
  };

  cartStore.set(getCartKey(userId), updatedCart);
  return updatedCart;
}

export function getReservedDeliveryDates(): string[] {
  return [...cartStore.values()].flatMap((cart) => getCartReservations(cart).map((reservation) => reservation.deliveryDate));
}

export function clearCart(userId?: string): Cart {
  const cartKey = getCartKey(userId);
  const cart = getCart(userId);
  const clearedCart: Cart = {
    ...cart,
    items: [],
    total: 0,
    updatedAt: new Date().toISOString(),
  };

  cartStore.set(cartKey, clearedCart);
  return clearedCart;
}

export function getCartSummary(userId?: string): Cart {
  return getCart(userId);
}

export function buildCart(items: CartItem[]): Cart {
  return calculateCart(items);
}
