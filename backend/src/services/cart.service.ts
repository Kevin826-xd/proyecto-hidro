import { randomUUID } from "node:crypto";
import { Cart, CartItem } from "../entities/cart.entity";

const cartStore = new Map<string, Cart>();

function getCartKey(userId?: string): string {
  return userId ?? "guest";
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

  const total = Number(
    normalizedItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2),
  );

  return {
    id: randomUUID(),
    items: normalizedItems,
    total,
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
    throw new Error("Quantity must be a positive integer");
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
    total: Number(nextItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)),
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
    throw new Error("Quantity must be an integer");
  }

  const existingItem = cart.items.find((item) => item.productId === productId);

  if (!existingItem) {
    throw new Error("Product not found in cart");
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
    total: Number(nextItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)),
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
    total: Number(nextItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)),
    updatedAt: new Date().toISOString(),
  };

  cartStore.set(getCartKey(userId), updatedCart);
  return updatedCart;
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
