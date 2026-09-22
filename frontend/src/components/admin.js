import { getAdminProducts, getAdminReservations, updateAdminProduct } from "../services/adminService.js";
import { formatPrice, formatDate } from "../utils/formatters.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderProducts(elements, products) {
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

function renderReservations(elements, reservations) {
  if (!reservations.length) {
    elements.adminReservations.innerHTML = '<p class="admin-empty">No hay reservas registradas.</p>';
    return;
  }

  elements.adminReservations.innerHTML = `<div class="admin-table-wrapper"><table class="admin-table">
    <thead><tr><th>Fecha</th><th>Usuario</th><th>Ubicación</th></tr></thead>
    <tbody>${reservations.map((reservation) => `<tr>
      <td>${formatDate(reservation.deliveryDate)}</td>
      <td>${escapeHtml(reservation.userId || "Sin usuario")}</td>
      <td>${escapeHtml(reservation.deliveryCity && reservation.deliveryAddress ? `${reservation.deliveryCity} - ${reservation.deliveryAddress}` : "Retiro en tienda")}</td>
    </tr>`).join("")}</tbody>
  </table></div>`;
}

export function createAdminPage(elements, setStatus) {
  let currentUserId = "";

  async function render(user) {
    if (!user || user.role !== "admin") {
      elements.adminPanel.classList.add("hidden");
      return;
    }

    currentUserId = user.email;
    elements.adminPanel.classList.remove("hidden");
    try {
      const [products, reservations] = await Promise.all([
        getAdminProducts(),
        getAdminReservations(currentUserId),
      ]);
      renderProducts(elements, products);
      renderReservations(elements, reservations);
    } catch (error) {
      elements.adminPanel.classList.add("hidden");
      setStatus(error.message || "No se pudo cargar el panel admin.", "error");
    }
  }

  elements.adminPanel.addEventListener("click", async (event) => {
    const button = event.target.closest(".admin-save-product");
    if (!button) return;

    const row = button.closest("tr");
    const price = Number(row.querySelector(".admin-product-price").value);
    const stock = Number(row.querySelector(".admin-product-stock").value);
    if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0) {
      setStatus("El precio debe ser mayor que cero y el stock un entero no negativo.", "error");
      return;
    }

    button.disabled = true;
    try {
      await updateAdminProduct(row.dataset.productId, { price, stock }, currentUserId);
      setStatus("Producto actualizado correctamente.", "success");
    } catch (error) {
      setStatus(error.message || "No se pudo actualizar el producto.", "error");
    } finally {
      button.disabled = false;
    }
  });

  return {
    render,
    hide: () => elements.adminPanel.classList.add("hidden"),
  };
}
