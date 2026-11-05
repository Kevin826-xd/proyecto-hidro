import { createAdminPage } from "./components/admin";
import { setStatus, showAuthPanel, showCatalog } from "./components/auth";
import { attachCartEvents, mergeGuestCart, renderCart, syncCartFromServer } from "./components/cart";
import { renderReservationHistory } from "./components/reservationHistory";
import { attachShippingEvents, restoreShippingDraft, updateShippingPanel } from "./components/shipping";
import { renderCalendar } from "./components/shippingCalendar";
import { clearDeliveryLocation, setDeliveryArea } from "./components/shippingLocation";
import { createElements } from "./elements";
import { createAuthPage } from "./pages/auth.page";
import { createCatalogPage } from "./pages/catalog.page";
import { SESSION_EXPIRED_EVENT } from "./services/apiClient";
import { getCurrentUser } from "./services/sessionService";
import { appState } from "./state/appState";
import type { SetStatus } from "./types/ui";

const elements = createElements();
const setMessage: SetStatus = (message, type) => setStatus(elements, message, type);
const catalogPage = createCatalogPage(elements, appState, setMessage);
const adminPage = createAdminPage(elements, setMessage);

function loadCatalog(): Promise<void> {
  return catalogPage.load();
}

function loadUserCart(): Promise<void> {
  return syncCartFromServer(elements, appState, (cart) => {
    if (cart.deliveryDate) {
      const date = new Date(`${cart.deliveryDate}T00:00:00`);
      appState.calendarMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    }
    renderCalendar(elements, appState);
    renderReservationHistory(elements, appState);
    updateShippingPanel(elements, appState);
  });
}

function resetUserState(): void {
  Object.assign(appState, {
    cartItems: [],
    selectedDeliveryDate: "",
    savedDeliveryDate: "",
    editingDeliveryDate: "",
    reservedDeliveryCity: "",
    reservedDeliveryAddress: "",
    deliveryReservations: [],
    reservedDeliveryDates: [],
    calendarMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  });
  setDeliveryArea(elements);
  elements.shippingAddress.value = "";
  clearDeliveryLocation();
  renderCart(elements, appState);
  renderCalendar(elements, appState);
  renderReservationHistory(elements, appState);
}

const authPage = createAuthPage(elements, {
  onLogin: async (user) => {
    // El catálogo ya está cargado (es público), así el cliente vuelve a la categoría que estaba viendo.
    authPage.render(() => {});
    adminPage.render(user || getCurrentUser());
    // Primero se pasa el carrito del visitante a su cuenta y después se carga el carrito completo.
    await mergeGuestCart(setMessage);
    await loadUserCart();
    if (restoreShippingDraft(elements, appState)) {
      await openShippingPanel();
      setMessage("Sesión iniciada. Revisa los datos y confirma tu reserva.", "success");
    }
  },
  onLogout: showLoggedOutState,
});

function showLoggedOutState(): void {
  resetUserState();
  adminPage.hide();
  authPage.render(() => {});
  loadCatalog();
}

// El backend respondió 401: el token expiró o ya no es válido.
window.addEventListener(SESSION_EXPIRED_EVENT, () => {
  showLoggedOutState();
  showAuthPanel(elements, "Tu sesión expiró. Inicia sesión nuevamente.");
});

attachCartEvents(elements, appState, setMessage);
const loadReservedDates = attachShippingEvents(elements, appState, setMessage, (date) => {
  setMessage(`Despacho reservado para el ${date}.`, "success");
  elements.shippingPanel.classList.add("hidden");
  elements.catalogLayout.classList.remove("hidden");
}, () => showAuthPanel(elements, "Inicia sesión o regístrate para reservar tu despacho."));

async function openShippingPanel(): Promise<void> {
  elements.cartPanel.classList.add("hidden");
  elements.shippingPanel.classList.remove("hidden");
  elements.catalogLayout.classList.add("hidden");
  await loadReservedDates();
}

elements.reloadBtn.addEventListener("click", () => {
  showCatalog(elements);
  loadCatalog();
});
elements.cartBtn.addEventListener("click", () => {
  const shouldShowCart = elements.cartPanel.classList.contains("hidden");
  elements.cartPanel.classList.toggle("hidden", !shouldShowCart);
  elements.shippingPanel.classList.add("hidden");
  elements.catalogLayout.classList.toggle("hidden", shouldShowCart);
});
elements.closeCartBtn.addEventListener("click", () => {
  elements.cartPanel.classList.add("hidden");
  elements.catalogLayout.classList.remove("hidden");
});
elements.shippingBtn.addEventListener("click", async () => {
  if (elements.shippingPanel.classList.contains("hidden")) {
    await openShippingPanel();
    return;
  }
  elements.shippingPanel.classList.add("hidden");
  elements.catalogLayout.classList.remove("hidden");
});
elements.closeShippingBtn.addEventListener("click", () => {
  elements.shippingPanel.classList.add("hidden");
  elements.catalogLayout.classList.remove("hidden");
});

authPage.render(() => adminPage.render(getCurrentUser()));
loadCatalog();
// Con sesión carga el carrito del servidor; sin sesión, el carrito guardado del visitante.
loadUserCart();
renderCalendar(elements, appState);
renderReservationHistory(elements, appState);
updateShippingPanel(elements, appState);
