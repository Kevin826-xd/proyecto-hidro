import { addCartItem, getCart, removeCartItem, updateCartItemQuantity } from "../services/cartService.js";
import { clearGuestCart, readGuestCart, saveGuestCart } from "../services/guestCartService.js";
import { getCurrentUser } from "../services/sessionService.js";
import { formatPrice } from "../utils/formatters.js";
import { setDeliveryArea } from "./shipping.js";

export function renderCart(elements, state) {
  const subtotal = state.cartItems.reduce((sum, item) => sum + Number(item.subtotal || item.price * item.quantity), 0);
  elements.cartTotal.textContent = formatPrice(subtotal);
  elements.cartCount.textContent = String(state.cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0));
  if (!state.cartItems.length) {
    elements.cartItemsList.innerHTML = '<div class="empty-cart"><p>Tu carrito está vacío.</p></div>';
    return;
  }
  elements.cartItemsList.innerHTML = state.cartItems.map((item) => `<div class="cart-item" data-product-id="${item.productId}">
    <div><strong>${item.name}</strong><p>${formatPrice(item.price)} c/u</p></div>
    <div class="cart-item-actions">
      <button class="qty-button" type="button" data-action="decrease" data-product-id="${item.productId}">-</button>
      <span>${item.quantity}</span>
      <button class="qty-button" type="button" data-action="increase" data-product-id="${item.productId}">+</button>
      <button class="remove-button" type="button" data-action="remove" data-product-id="${item.productId}">Quitar</button>
    </div>
  </div>`).join("");
}

export async function syncCartFromServer(elements, state, onCartLoaded) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    state.cartItems = readGuestCart();
    renderCart(elements, state);
    return;
  }
  try {
    const cart = await getCart();
    state.cartItems = cart.items || [];
    state.selectedDeliveryDate = cart.deliveryDate || "";
    state.savedDeliveryDate = state.selectedDeliveryDate;
    state.reservedDeliveryCity = cart.deliveryCity || "";
    state.reservedDeliveryAddress = cart.deliveryAddress || "";
    state.deliveryReservations = Array.isArray(cart.deliveryReservations) ? cart.deliveryReservations : [];
    setDeliveryArea(elements, state.reservedDeliveryCity);
    elements.shippingAddress.value = state.reservedDeliveryAddress;
    elements.deliveryDate.value = state.selectedDeliveryDate;
    onCartLoaded(cart);
    renderCart(elements, state);
  } catch (error) {
    console.error(error);
    state.cartItems = [];
    renderCart(elements, state);
  }
}

// Mismo mensaje que da el backend cuando no alcanza el stock.
function stockError(stock) {
  return stock > 0 ? `Solo quedan ${stock} unidades disponibles` : "Producto sin stock";
}

// Cambia la cantidad de un producto en el carrito del visitante; con 0 se quita.
function setGuestQuantity(state, productId, quantity) {
  const items = readGuestCart();
  const item = items.find((current) => String(current.productId) === String(productId));
  if (!item) return;
  if (quantity > item.stock) throw new Error(stockError(item.stock));

  const nextItems = quantity > 0
    ? items.map((current) => (current === item ? { ...item, quantity, subtotal: item.price * quantity } : current))
    : items.filter((current) => current !== item);
  saveGuestCart(nextItems);
  state.cartItems = nextItems;
}

function addGuestProduct(product, state) {
  const items = readGuestCart();
  const item = items.find((current) => String(current.productId) === String(product.id));
  if (item) {
    setGuestQuantity(state, product.id, item.quantity + 1);
    return;
  }
  if (product.stock < 1) throw new Error(stockError(product.stock));

  const price = Number(product.price);
  const nextItems = [...items, { productId: product.id, name: product.name, price, stock: product.stock, quantity: 1, subtotal: price }];
  saveGuestCart(nextItems);
  state.cartItems = nextItems;
}

// Al iniciar sesión, los productos del carrito del visitante se agregan al carrito de su cuenta.
export async function mergeGuestCart(setStatus) {
  const items = readGuestCart();
  if (!items.length) return;

  const failed = [];
  for (const item of items) {
    try {
      await addCartItem(item.productId, item.quantity);
    } catch (error) {
      console.error(error);
      failed.push(item.name);
    }
  }
  clearGuestCart();
  if (failed.length) {
    setStatus(`No pudimos pasar a tu cuenta: ${failed.join(", ")}. Revisa el stock disponible.`, "error");
  }
}

export async function addProductToCart(product, elements, state, setStatus) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    try {
      addGuestProduct(product, state);
      renderCart(elements, state);
      setStatus(`${product.name} agregado al carrito.`, "success");
    } catch (error) {
      setStatus(error.message, "error");
    }
    return;
  }
  try {
    const cart = await addCartItem(product.id, 1);
    state.cartItems = cart.items || [];
    renderCart(elements, state);
    setStatus(`${product.name} agregado al carrito.`, "success");
  } catch (error) {
    console.error(error);
    setStatus(error.message || "No se pudo agregar el producto.", "error");
  }
}

export function attachCartEvents(elements, state, setStatus) {
  elements.cartItemsList.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const item = state.cartItems.find((currentItem) => String(currentItem.productId) === String(button.dataset.productId));
    if (!item) return;
    try {
      const action = button.dataset.action;
      if (!getCurrentUser()) {
        const quantity = action === "remove" ? 0 : action === "increase" ? item.quantity + 1 : item.quantity - 1;
        setGuestQuantity(state, item.productId, quantity);
        renderCart(elements, state);
        if (action === "remove") setStatus("Producto quitado del carrito.", "success");
        return;
      }
      const cart = action === "remove"
        ? await removeCartItem(item.productId)
        : await updateCartItemQuantity(item.productId, action === "increase" ? item.quantity + 1 : item.quantity - 1);
      state.cartItems = cart.items || [];
      renderCart(elements, state);
      if (action === "remove") setStatus("Producto quitado del carrito.", "success");
    } catch (error) {
      setStatus(error.message || "No se pudo actualizar el carrito.", "error");
    }
  });
}