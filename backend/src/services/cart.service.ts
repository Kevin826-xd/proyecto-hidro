import { database } from "../db/connection";
import { Cart, CartItemRow } from "../entities/cart.entity";
import { NotFoundError, ValidationError } from "../errors/http-errors";
import { isUuid } from "../utils/uuid";

function roundPrice(value: number): number {
  return Number(value.toFixed(2));
}

export function validateQuantity(quantity: unknown, { allowZero = false } = {}): number {
  const minimum = allowZero ? 0 : 1;

  if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < minimum) {
    throw new ValidationError(allowZero
      ? "La cantidad debe ser un entero mayor o igual a cero"
      : "La cantidad debe ser un entero positivo");
  }

  return quantity;
}

// El precio sale siempre de la tabla products; nunca de lo que envía el navegador.
export function buildCart(userId: string, rows: CartItemRow[]): Cart {
  const items = rows.map((row) => {
    const price = Number(row.price);
    return {
      productId: row.productId,
      name: row.name,
      price,
      quantity: row.quantity,
      subtotal: roundPrice(price * row.quantity),
    };
  });

  return {
    userId,
    items,
    total: roundPrice(items.reduce((sum, item) => sum + item.subtotal, 0)),
  };
}

async function findProductStock(productId: string): Promise<number> {
  if (!isUuid(productId)) {
    throw new NotFoundError("Producto no encontrado");
  }

  const result = await database.query<{ stock: number }>("SELECT stock FROM products WHERE id = $1", [productId]);
  if (!result.rowCount) {
    throw new NotFoundError("Producto no encontrado");
  }

  return result.rows[0].stock;
}

async function findCartQuantity(userId: string, productId: string): Promise<number> {
  const result = await database.query<{ quantity: number }>(
    "SELECT quantity FROM cart_items WHERE user_id = $1 AND product_id = $2",
    [userId, productId],
  );
  return result.rows[0]?.quantity ?? 0;
}

function ensureStock(quantity: number, stock: number): void {
  if (quantity > stock) {
    throw new ValidationError(stock > 0 ? `Solo quedan ${stock} unidades disponibles` : "Producto sin stock");
  }
}

export async function getCart(userId: string): Promise<Cart> {
  const result = await database.query<CartItemRow>(
    `SELECT ci.product_id AS "productId", p.name, p.price, ci.quantity
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.user_id = $1
     ORDER BY ci.added_at`,
    [userId],
  );

  return buildCart(userId, result.rows);
}

export async function addItemToCart(userId: string, productId: string, quantity: unknown): Promise<Cart> {
  const safeQuantity = validateQuantity(quantity);
  const stock = await findProductStock(productId);
  ensureStock((await findCartQuantity(userId, productId)) + safeQuantity, stock);

  await database.query(
    `INSERT INTO cart_items (user_id, product_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, product_id)
     DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity, updated_at = NOW()`,
    [userId, productId, safeQuantity],
  );

  return getCart(userId);
}

// Con cantidad 0 el producto se quita del carrito.
export async function updateCartItemQuantity(userId: string, productId: string, quantity: unknown): Promise<Cart> {
  const safeQuantity = validateQuantity(quantity, { allowZero: true });

  if (!isUuid(productId) || !(await findCartQuantity(userId, productId))) {
    throw new NotFoundError("Producto no encontrado en el carrito");
  }

  if (safeQuantity === 0) {
    return removeItemFromCart(userId, productId);
  }

  ensureStock(safeQuantity, await findProductStock(productId));
  await database.query(
    "UPDATE cart_items SET quantity = $3, updated_at = NOW() WHERE user_id = $1 AND product_id = $2",
    [userId, productId, safeQuantity],
  );

  return getCart(userId);
}

export async function removeItemFromCart(userId: string, productId: string): Promise<Cart> {
  if (isUuid(productId)) {
    await database.query("DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2", [userId, productId]);
  }

  return getCart(userId);
}
