import { createAdminPage } from "./components/admin";
import { setStatus, showAuthPanel, showCatalog } from "./components/auth";
import { attachCartEvents, mergeGuestCart, renderCart, syncCartFromServer } from "./components/cart";
import { attachQuoteEvents, prepareQuotePanel, renderQuoteCount } from "./components/quote";
import { renderReservationHistory } from "./components/reservationHistory";
import { attachShippingEvents, restoreShippingDraft, updateShippingPanel } from "./components/shipping";
import { renderCalendar } from "./components/shippingCalendar";
import { clearDeliveryLocation, setDeliveryArea } from "./components/shippingLocation";
import { createElements } from "./elements";
import { createAuthPage } from "./pages/auth.page";
import { createCatalogPage } from "./pages/catalog.page";
import { SESSION_EXPIRED_EVENT } from "./services/apiClient";
import { QUOTE_LIST_CHANGED_EVENT } from "./services/quoteListService";
import { getCurrentUser } from "./services/sessionService";
import { appState } from "./state/appState";
import type { SetStatus } from "./types/ui";

type Panel = "cart" | "shipping" | "quote";

const elements = createElements();
const setMessage: SetStatus = (message, type) => setStatus(elements, message, type);
const catalogPage = createCatalogPage(elements, appState, setMessage, openQuotePanel);
const adminPage = createAdminPage(elements, setMessage, loadCatalog);

// Muestra un solo panel (carrito, despacho o cotización) en lugar del catálogo; con null vuelve al catálogo.
function showPanel(panel: Panel | null): void {
  elements.cartPanel.classList.toggle("hidden", panel !== "cart");
  elements.shippingPanel.classList.toggle("hidden", panel !== "shipping");
  elements.quotePanel.classList.toggle("hidden", panel !== "quote");
  elements.catalogLayout.classList.toggle("hidden", panel !== null);
}

function openQuotePanel(): void {
  prepareQuotePanel(elements);
  showPanel("quote");
  elements.quotePanel.scrollIntoView({ block: "start" });
}

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
  showPanel(null);
}, () => showAuthPanel(elements, "Inicia sesión o regístrate para reservar tu despacho."));
attachQuoteEvents(elements, () => showPanel(null));
// El contador del encabezado se actualiza cada vez que cambia la lista de cotización.
window.addEventListener(QUOTE_LIST_CHANGED_EVENT, () => renderQuoteCount(elements));

async function openShippingPanel(): Promise<void> {
  showPanel("shipping");
  await loadReservedDates();
}

// Cada botón del encabezado abre su panel, o vuelve al catálogo si ese panel ya estaba abierto.
function isPanelOpen(panel: HTMLElement): boolean {
  return !panel.classList.contains("hidden");
}

elements.reloadBtn.addEventListener("click", () => {
  showCatalog(elements);
  loadCatalog();
});
elements.cartBtn.addEventListener("click", () => showPanel(isPanelOpen(elements.cartPanel) ? null : "cart"));
elements.closeCartBtn.addEventListener("click", () => showPanel(null));
elements.quoteBtn.addEventListener("click", () => {
  if (isPanelOpen(elements.quotePanel)) {
    showPanel(null);
    return;
  }
  openQuotePanel();
});
elements.shippingBtn.addEventListener("click", async () => {
  if (isPanelOpen(elements.shippingPanel)) {
    showPanel(null);
    return;
  }
  await openShippingPanel();
});
elements.closeShippingBtn.addEventListener("click", () => showPanel(null));

authPage.render(() => adminPage.render(getCurrentUser()));
loadCatalog();
// Con sesión carga el carrito del servidor; sin sesión, el carrito guardado del visitante.
loadUserCart();
renderQuoteCount(elements);
renderCalendar(elements, appState);
renderReservationHistory(elements, appState);
updateShippingPanel(elements, appState);
