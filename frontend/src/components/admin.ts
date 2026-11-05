import type { AppElements } from "../elements";
import { getAdminProducts, getAdminReservations, updateAdminProduct } from "../services/adminService";
import type { AdminReservation, Product, SessionUser } from "../types/api";
import type { SetStatus } from "../types/ui";
import { escapeHtml, formatDate, formatDistance, formatPrice, getErrorMessage } from "../utils/formatters";
import { createReservationsMap, hasLocation } from "./deliveryMap";

type ReservationsMap = ReturnType<typeof createReservationsMap>;

function renderProducts(elements: AppElements, products: Product[]): void {
  if (!products.length) {
    elements.adminProducts.innerHTML = '<p class="admin-empty">No hay productos disponibles.</p>';
    return;
  }

  elements.adminProducts.innerHTML = `<div class="admin-table-wrapper"><table class="admin-table">
    <thead><tr><th>Producto</th><th>Precio</th><th>Stock</th><th>Acción</th></tr></thead>
    <tbody>${products.map((product) => `<tr data-product-id="${escapeHtml(product.id)}">
      <td>${escapeHtml(product.name)}</td>
      <td><input class="admin-product-price" type="number" min="1" step="1" value="${Number(product.price)}" aria-label="Precio de ${escapeHtml(product.name)}" /></td>
      <td><input class="admin-product-stock" type="number" min="0" step="1" value="${Number(product.stock)}" aria-label="Stock de ${escapeHtml(product.name)}" /></td>
      <td><button class="button small admin-save-product" type="button">Guardar</button></td>
    </tr>`).join("")}</tbody>
  </table></div>`;
}

function describeLocation(reservation: AdminReservation): string {
  return reservation.deliveryCity && reservation.deliveryAddress
    ? `${reservation.deliveryCity} - ${reservation.deliveryAddress}`
    : "Retiro en tienda";
}

function describeDeliveryCost(reservation: AdminReservation): string {
  return Number.isFinite(reservation.deliveryCost)
    ? `${formatPrice(reservation.deliveryCost)} (${formatDistance(reservation.deliveryDistanceKm)})`
    : "—";
}

// Se arma con textContent (no con HTML) para que los datos del cliente no se interpreten como código.
function buildReservationPopup(reservation: AdminReservation): HTMLElement {
  const popup = document.createElement("div");
  const date = document.createElement("strong");
  date.textContent = formatDate(reservation.deliveryDate);
  const user = document.createElement("div");
  user.textContent = reservation.userId || "Sin usuario";
  const address = document.createElement("div");
  address.textContent = describeLocation(reservation);
  const cost = document.createElement("div");
  cost.textContent = `Despacho: ${describeDeliveryCost(reservation)}`;
  popup.append(date, user, address, cost);
  return popup;
}

function renderReservations(elements: AppElements, reservations: AdminReservation[], reservationsMap: ReservationsMap): void {
  const hasMarkedLocations = reservations.some((reservation) => hasLocation(reservation));
  elements.adminReservationsMap.classList.toggle("hidden", !hasMarkedLocations);
  if (hasMarkedLocations) {
    reservationsMap.render(reservations);
  }

  if (!reservations.length) {
    elements.adminReservations.innerHTML = '<p class="admin-empty">No hay reservas registradas.</p>';
    return;
  }

  elements.adminReservations.innerHTML = `<div class="admin-table-wrapper"><table class="admin-table">
    <thead><tr><th>Fecha</th><th>Usuario</th><th>Ubicación</th><th>Despacho</th><th>Mapa</th></tr></thead>
    <tbody>${reservations.map((reservation) => `<tr>
      <td>${formatDate(reservation.deliveryDate)}</td>
      <td>${escapeHtml(reservation.userId || "Sin usuario")}</td>
      <td>${escapeHtml(describeLocation(reservation))}</td>
      <td>${describeDeliveryCost(reservation)}</td>
      <td>${hasLocation(reservation)
        ? `<a href="https://www.openstreetmap.org/?mlat=${reservation.deliveryLat}&amp;mlon=${reservation.deliveryLng}#map=18/${reservation.deliveryLat}/${reservation.deliveryLng}" target="_blank" rel="noopener noreferrer">Ver ubicación</a>`
        : "—"}</td>
    </tr>`).join("")}</tbody>
  </table></div>`;
}

export function createAdminPage(elements: AppElements, setStatus: SetStatus) {
  const reservationsMap = createReservationsMap(elements.adminReservationsMap, buildReservationPopup);

  async function render(user: SessionUser | null): Promise<void> {
    if (!user || user.role !== "admin") {
      elements.adminPanel.classList.add("hidden");
      return;
    }

    elements.adminPanel.classList.remove("hidden");
    try {
      const [products, reservations] = await Promise.all([
        getAdminProducts(),
        getAdminReservations(),
      ]);
      renderProducts(elements, products);
      renderReservations(elements, reservations, reservationsMap);
    } catch (error) {
      elements.adminPanel.classList.add("hidden");
      setStatus(getErrorMessage(error, "No se pudo cargar el panel admin."), "error");
    }
  }

  elements.adminPanel.addEventListener("click", async (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>(".admin-save-product");
    const row = button?.closest<HTMLTableRowElement>("tr");
    if (!button || !row?.dataset.productId) return;

    const price = Number(row.querySelector<HTMLInputElement>(".admin-product-price")?.value);
    const stock = Number(row.querySelector<HTMLInputElement>(".admin-product-stock")?.value);
    if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0) {
      setStatus("El precio debe ser mayor que cero y el stock un entero no negativo.", "error");
      return;
    }

    button.disabled = true;
    try {
      await updateAdminProduct(row.dataset.productId, { price, stock });
      setStatus("Producto actualizado correctamente.", "success");
    } catch (error) {
      setStatus(getErrorMessage(error, "No se pudo actualizar el producto."), "error");
    } finally {
      button.disabled = false;
    }
  });

  return {
    render,
    hide: () => elements.adminPanel.classList.add("hidden"),
  };
}
