import type { AppElements } from "../elements";
import { getAdminProducts, getAdminReservations, updateAdminProduct } from "../services/adminService";
import { getCategories } from "../services/categoriesService";
import type { AdminReservation, Category, SessionUser } from "../types/api";
import type { SetStatus } from "../types/ui";
import { escapeHtml, formatDate, formatDistance, formatPrice, getErrorMessage } from "../utils/formatters";
import { attachCatalogForms, renderCategoryOptions } from "./adminCatalogForms";
import { attachAdminProductSearch, renderAdminProducts, showAdminProduct } from "./adminProducts";
import { createReservationsMap, hasLocation } from "./deliveryMap";

type ReservationsMap = ReturnType<typeof createReservationsMap>;

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

// onCatalogChanged recarga el catálogo público cuando el administrador crea una categoría o un producto.
export function createAdminPage(elements: AppElements, setStatus: SetStatus, onCatalogChanged: () => void | Promise<void>) {
  const reservationsMap = createReservationsMap(elements.adminReservationsMap, buildReservationPopup);
  attachAdminProductSearch(elements.adminProducts);

  async function render(user: SessionUser | null): Promise<void> {
    if (!user || user.role !== "admin") {
      elements.adminPanel.classList.add("hidden");
      return;
    }

    elements.adminPanel.classList.remove("hidden");
    try {
      const [categories, products, reservations] = await Promise.all([
        getCategories(),
        getAdminProducts(),
        getAdminReservations(),
      ]);
      renderAdminProducts(elements.adminProducts, categories, products);
      renderCategoryOptions(elements, categories);
      renderReservations(elements, reservations, reservationsMap);
    } catch (error) {
      elements.adminPanel.classList.add("hidden");
      setStatus(getErrorMessage(error, "No se pudo cargar el panel admin."), "error");
    }
  }

  // Después de crear una categoría o un producto se recargan la tabla de precios, las opciones
  // de los formularios y el catálogo, para que el cambio se vea en todas partes sin recargar la página.
  async function refreshCatalogData(): Promise<Category[]> {
    const [categories, products] = await Promise.all([getCategories(), getAdminProducts()]);
    renderAdminProducts(elements.adminProducts, categories, products);
    renderCategoryOptions(elements, categories);
    void onCatalogChanged();
    return categories;
  }

  attachCatalogForms(elements, {
    onCategoryCreated: async (category) => {
      await refreshCatalogData();
      // Deja la categoría nueva elegida en el formulario de productos, lista para agregarle productos.
      elements.newProductCategory.value = category.id;
    },
    onProductCreated: async (product) => {
      await refreshCatalogData();
      showAdminProduct(elements.adminProducts, product.name);
    },
  });

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
