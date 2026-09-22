import { appState } from "./state/appState.js";
import { attachCartEvents, renderCart, syncCartFromServer } from "./components/cart.js";
import { setStatus } from "./components/auth.js";
import { attachShippingEvents, renderCalendar, renderReservationHistory, updateShippingPanel } from "./components/shipping.js";
import { createAuthPage } from "./pages/auth.page.js";
import { createCatalogPage } from "./pages/catalog.page.js";
import { createAdminPage } from "./components/admin.js";
import { getCurrentUser } from "./services/sessionService.js";

const elementIds = [
  "productsGrid", "categoriesContainer", "statusMessage", "reloadBtn", "authPanel", "catalogWrapper", "logoutBtn", "loginForm", "registerForm",
  "loginAuthMessage", "registerAuthMessage", "showRegisterBtn", "showLoginBtn", "registerName", "registerEmail", "registerPassword",
  "adminPanel", "adminProducts", "adminReservations",
  "cartBtn", "cartPanel", "shippingBtn", "shippingPanel", "closeShippingBtn", "shippingAddressField", "shippingCity",
  "shippingAddress", "deliveryDate", "previousMonthBtn", "nextMonthBtn", "calendarMonthLabel", "calendarGrid",
  "selectedDateLabel", "reservationList", "confirmShippingBtn", "cartItemsList", "cartTotal", "cartCount", "closeCartBtn",
];
const elements = Object.fromEntries(elementIds.map((id) => [id, document.getElementById(id)]));
const setMessage = (message, type) => setStatus(elements, message, type);
const catalogPage = createCatalogPage(elements, appState, setMessage);
const adminPage = createAdminPage(elements, setMessage);
const addProduct = catalogPage.addProduct;

function loadCatalog() {
  return catalogPage.load();
}

function loadUserCart() {
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

function resetUserState() {
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
  elements.shippingCity.value = "";
  elements.shippingAddress.value = "";
  renderCart(elements, appState);
  renderCalendar(elements, appState);
  renderReservationHistory(elements, appState);
}

const authPage = createAuthPage(elements, {
  onLogin: (user) => {
    elements.categoriesContainer.innerHTML = "";
    elements.productsGrid.innerHTML = "";
    authPage.render(loadUserCart);
    catalogPage.renderFallback();
    loadCatalog();
    adminPage.render(user || getCurrentUser());
  },
  onLogout: () => {
    resetUserState();
    elements.categoriesContainer.innerHTML = "";
    elements.productsGrid.innerHTML = "";
    adminPage.hide();
    authPage.render(() => {});
    catalogPage.renderFallback();
  },
});

attachCartEvents(elements, appState, setMessage);
const loadReservedDates = attachShippingEvents(elements, appState, setMessage, (date) => {
  setMessage(`Despacho reservado para el ${date}.`, "success");
  elements.shippingPanel.classList.add("hidden");
  elements.productsGrid.classList.remove("hidden");
});

elements.reloadBtn.addEventListener("click", loadCatalog);
elements.cartBtn.addEventListener("click", () => {
  const shouldShowCart = elements.cartPanel.classList.contains("hidden");
  elements.cartPanel.classList.toggle("hidden", !shouldShowCart);
  elements.shippingPanel.classList.add("hidden");
  elements.productsGrid.classList.toggle("hidden", shouldShowCart);
});
elements.closeCartBtn.addEventListener("click", () => {
  elements.cartPanel.classList.add("hidden");
  elements.productsGrid.classList.remove("hidden");
});
elements.shippingBtn.addEventListener("click", async () => {
  const shouldShow = elements.shippingPanel.classList.contains("hidden");
  elements.cartPanel.classList.add("hidden");
  elements.shippingPanel.classList.toggle("hidden", !shouldShow);
  elements.productsGrid.classList.toggle("hidden", shouldShow);
  if (shouldShow) await loadReservedDates();
});
elements.closeShippingBtn.addEventListener("click", () => {
  elements.shippingPanel.classList.add("hidden");
  elements.productsGrid.classList.remove("hidden");
});

authPage.render(() => {
  adminPage.render(getCurrentUser());
  loadUserCart();
});
catalogPage.renderFallback();
renderCart(elements, appState);
renderCalendar(elements, appState);
renderReservationHistory(elements, appState);
updateShippingPanel(elements, appState);