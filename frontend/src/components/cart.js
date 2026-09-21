import { addCartItem, getCart, removeCartItem, updateCartItemQuantity } from "../services/cartService.js";
import { getCurrentUser } from "../services/sessionService.js";
import { formatPrice } from "../utils/formatters.js";

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
    state.cartItems = [];
    renderCart(elements, state);
    return;
  }
  try {
    const cart = await getCart(currentUser.email);
    state.cartItems = cart.items || [];
    state.selectedDeliveryDate = cart.deliveryDate || "";
    state.savedDeliveryDate = state.selectedDeliveryDate;
    state.reservedDeliveryCity = cart.deliveryCity || "";
    state.reservedDeliveryAddress = cart.deliveryAddress || "";
    state.deliveryReservations = Array.isArray(cart.deliveryReservations) ? cart.deliveryReservations : [];
    elements.shippingCity.value = state.reservedDeliveryCity;
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

export async function addProductToCart(product, elements, state, setStatus) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    setStatus("Debes iniciar sesión para agregar productos al carrito.", "error");
    return;
  }
  try {
    const cart = await addCartItem({ productId: product.id, name: product.name, price: Number(product.price), quantity: 1 }, currentUser.email);
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
      const user = getCurrentUser();
      const action = button.dataset.action;
      const cart = action === "remove"
        ? await removeCartItem(item.productId, user.email)
        : await updateCartItemQuantity(item.productId, action === "increase" ? item.quantity + 1 : item.quantity - 1, user.email);
      state.cartItems = cart.items || [];
      renderCart(elements, state);
      if (action === "remove") setStatus("Producto quitado del carrito.", "success");
    } catch (error) {
      setStatus(error.message || "No se pudo actualizar el carrito.", "error");
    }
  });
}