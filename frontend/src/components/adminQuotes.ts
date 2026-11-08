import type { Quote } from "../types/api";
import { escapeHtml, formatDate, formatPrice, formatQuoteNumber } from "../utils/formatters";

// Cotizaciones recibidas en el panel de administración: una sección desplegable por cotización,
// de la más reciente a la más antigua, con los datos de contacto y los productos cotizados.

const CHEVRON_ICON = '<svg class="admin-category-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function isExpired(quote: Quote): boolean {
  return new Date(`${quote.validUntil}T23:59:59`) < new Date();
}

function contactMarkup(quote: Quote): string {
  const lines = [
    `<strong>Email:</strong> <a href="mailto:${escapeHtml(quote.customerEmail)}">${escapeHtml(quote.customerEmail)}</a>`,
    quote.customerPhone ? `<strong>Teléfono:</strong> ${escapeHtml(quote.customerPhone)}` : "",
    quote.companyName ? `<strong>Empresa:</strong> ${escapeHtml(quote.companyName)}` : "",
    quote.companyRut ? `<strong>RUT:</strong> ${escapeHtml(quote.companyRut)}` : "",
    `<strong>Cliente:</strong> ${quote.userId ? "con cuenta registrada" : "visitante sin cuenta"}`,
  ].filter(Boolean);
  const notes = quote.notes ? `<p class="admin-quote-notes"><strong>Comentario:</strong> ${escapeHtml(quote.notes)}</p>` : "";
  return `<p class="admin-quote-contact">${lines.join("<br />")}</p>${notes}`;
}

function quoteMarkup(quote: Quote): string {
  const created = new Date(quote.createdAt).toLocaleDateString("es-CL", { dateStyle: "medium" });
  const expired = isExpired(quote);
  const rows = quote.items.map((item) => `<tr>
      <td>${escapeHtml(item.productName)}</td>
      <td>${item.quantity}</td>
      <td>${formatPrice(item.unitPrice)}</td>
      <td>${formatPrice(item.subtotal)}</td>
    </tr>`).join("");

  return `<details class="admin-category admin-quote">
    <summary>
      ${CHEVRON_ICON}
      <span class="admin-category-name">
        ${formatQuoteNumber(quote.number)} · ${escapeHtml(quote.customerName)}${quote.companyName ? ` <small>(${escapeHtml(quote.companyName)})</small>` : ""}
        <small class="admin-quote-date">${escapeHtml(created)}</small>
      </span>
      <span class="admin-count ${expired ? "admin-count-muted" : ""}">${expired ? "Vencida" : `Vence ${escapeHtml(formatDate(quote.validUntil))}`}</span>
      <span class="admin-count">${formatPrice(quote.total)}</span>
    </summary>
    <div class="admin-category-body">
      ${contactMarkup(quote)}
      <div class="admin-table-wrapper"><table class="admin-table">
        <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>
  </details>`;
}

export function renderAdminQuotes(container: HTMLElement, quotes: Quote[]): void {
  container.innerHTML = quotes.length
    ? `<div class="admin-categories">${quotes.map(quoteMarkup).join("")}</div>`
    : '<p class="admin-empty">Todavía no se han recibido cotizaciones.</p>';
}
