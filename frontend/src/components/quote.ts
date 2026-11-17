import type { AppElements } from "../elements";
import { createQuote } from "../services/quoteService";
import { clearQuoteList, MAX_QUOTE_QUANTITY, readQuoteList, removeFromQuoteList, setQuoteQuantity } from "../services/quoteListService";
import { getCurrentUser } from "../services/sessionService";
import type { NewQuoteInput, Quote, QuoteCustomerType, QuoteListItem } from "../types/api";
import type { StatusType } from "../types/ui";
import { escapeHtml, formatCustomerType, formatDate, formatPrice, formatQuoteNumber, getErrorMessage } from "../utils/formatters";

// Panel de cotización: la lista que armó el cliente, el formulario con sus datos y la confirmación.
// No necesita sesión; si hay una iniciada, completa nombre y email.

type QuoteAction = "increase" | "decrease" | "remove";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setFormMessage(elements: AppElements, message: string, type: StatusType = "info"): void {
  elements.quoteFormMessage.textContent = message;
  elements.quoteFormMessage.dataset.type = type;
}

function optionalText(input: HTMLInputElement | HTMLTextAreaElement): string | undefined {
  return input.value.trim() || undefined;
}

// Tipo de cliente elegido en el formulario (Persona o Empresa).
function readCustomerType(elements: AppElements): QuoteCustomerType {
  const choice = elements.quoteForm.elements.namedItem("quoteCustomerType");
  return choice instanceof RadioNodeList && choice.value === "company" ? "company" : "person";
}

// Razón social y RUT solo se piden cuando la cotización es para una empresa.
function updateCompanyFields(elements: AppElements): void {
  elements.quoteCompanyFields.classList.toggle("hidden", readCustomerType(elements) !== "company");
}

export function renderQuoteCount(elements: AppElements): void {
  elements.quoteCount.textContent = String(readQuoteList().length);
}

function quoteItemMarkup(item: QuoteListItem): string {
  const name = escapeHtml(item.name);
  const productId = escapeHtml(item.productId);
  const quantity = Number(item.quantity) || 1;
  const stockNote = Number.isFinite(item.stock) && quantity > item.stock
    ? `<p class="quote-stock-note">Stock actual: ${Math.max(Number(item.stock), 0)}. Confirmaremos la disponibilidad del resto.</p>`
    : "";
  return `<div class="cart-item quote-item" data-product-id="${productId}">
    <div>
      <strong>${name}</strong>
      <p>${formatPrice(item.price)} c/u · Subtotal ${formatPrice(item.price * quantity)}</p>
      ${stockNote}
    </div>
    <div class="cart-item-actions">
      <button class="qty-button" type="button" data-action="decrease" aria-label="Una unidad menos de ${name}" ${quantity <= 1 ? "disabled" : ""}>-</button>
      <input class="quote-qty-input" type="number" min="1" max="${MAX_QUOTE_QUANTITY}" step="1" inputmode="numeric" value="${quantity}" aria-label="Cantidad de ${name}" />
      <button class="qty-button" type="button" data-action="increase" aria-label="Una unidad más de ${name}">+</button>
      <button class="remove-button" type="button" data-action="remove">Quitar</button>
    </div>
  </div>`;
}

export function renderQuoteList(elements: AppElements): void {
  const items = readQuoteList();
  renderQuoteCount(elements);
  const isEmpty = items.length === 0;
  elements.quoteSummary.classList.toggle("hidden", isEmpty);
  elements.quoteForm.classList.toggle("hidden", isEmpty);

  if (isEmpty) {
    elements.quoteItemsList.innerHTML = `<div class="empty-cart">
      <p>Tu cotización está vacía.</p>
      <p>Agrega productos desde el catálogo con el botón <strong>"Agregar a cotización"</strong>.</p>
    </div>`;
    return;
  }

  elements.quoteItemsList.innerHTML = items.map(quoteItemMarkup).join("");
  elements.quoteTotal.textContent = formatPrice(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
}

function quoteResultMarkup(quote: Quote): string {
  const created = new Date(quote.createdAt).toLocaleDateString("es-CL", { dateStyle: "long" });
  const rows = quote.items.map((item) => `<tr>
      <td>${escapeHtml(item.productName)}</td>
      <td>${item.quantity}</td>
      <td>${formatPrice(item.unitPrice)}</td>
      <td>${formatPrice(item.subtotal)}</td>
    </tr>`).join("");
  const company = quote.customerType === "company"
    ? `<p><strong>Empresa:</strong> ${escapeHtml([quote.companyName, quote.companyRut].filter(Boolean).join(" · "))}</p>`
    : `<p><strong>Cotización para:</strong> ${formatCustomerType(quote.customerType)}</p>`;

  return `<div class="quote-result-header">
      <p class="admin-eyebrow">Cotización enviada</p>
      <h3>${formatQuoteNumber(quote.number)}</h3>
      <p>Emitida el ${escapeHtml(created)} · Válida hasta el ${escapeHtml(formatDate(quote.validUntil))}</p>
    </div>
    <p>Gracias, <strong>${escapeHtml(quote.customerName)}</strong>. Te contactaremos a <strong>${escapeHtml(quote.customerEmail)}</strong> para confirmar precios y disponibilidad.</p>
    ${company}
    <div class="admin-table-wrapper">
      <table class="admin-table quote-table">
        <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="cart-total-row quote-result-total">
      <span>Total</span>
      <strong>${formatPrice(quote.total)}</strong>
    </div>
    <button class="button" type="button" data-action="back-to-catalog">Volver al catálogo</button>`;
}

function showResult(elements: AppElements, quote: Quote): void {
  elements.quoteEditor.classList.add("hidden");
  elements.quoteResult.classList.remove("hidden");
  elements.quoteResult.innerHTML = quoteResultMarkup(quote);
}

// Al abrir el panel se vuelve a la lista (por si quedó abierta la confirmación anterior)
// y, si hay sesión, se completan nombre y email cuando están vacíos.
export function prepareQuotePanel(elements: AppElements): void {
  elements.quoteResult.classList.add("hidden");
  elements.quoteEditor.classList.remove("hidden");
  setFormMessage(elements, "");
  const user = getCurrentUser();
  if (user) {
    if (!elements.quoteName.value) elements.quoteName.value = user.name;
    if (!elements.quoteEmail.value) elements.quoteEmail.value = user.email;
  }
  renderQuoteList(elements);
}

// Revisa el formulario. Devuelve los datos a enviar o un mensaje con lo que falta.
function readQuoteForm(elements: AppElements): NewQuoteInput | string {
  const items = readQuoteList();
  const customerName = elements.quoteName.value.trim();
  const customerEmail = elements.quoteEmail.value.trim();
  const customerPhone = elements.quotePhone.value.trim();
  const phoneDigits = customerPhone.replace(/\D/g, "").length;
  const customerType = readCustomerType(elements);
  const isCompany = customerType === "company";

  if (!items.length) return "Agrega al menos un producto a la cotización.";
  if (!customerName) return "Escribe tu nombre.";
  if (!EMAIL_PATTERN.test(customerEmail)) return "Escribe un correo electrónico válido para enviarte la cotización.";
  if (!customerPhone) return "Escribe un teléfono para contactarte.";
  // Misma regla que el backend: solo números, espacios y + ( ) -, entre 8 y 15 dígitos.
  if (!/^[\d\s+()-]+$/.test(customerPhone) || phoneDigits < 8 || phoneDigits > 15) {
    return "Escribe un teléfono válido, por ejemplo +56 9 1234 5678.";
  }
  // El dígito verificador del RUT lo revisa el backend.
  if (isCompany && !optionalText(elements.quoteCompany)) return "Escribe la razón social de la empresa.";
  if (isCompany && !optionalText(elements.quoteRut)) return "Escribe el RUT de la empresa.";

  return {
    customerType,
    customerName,
    customerEmail,
    customerPhone,
    // Una persona no envía datos de empresa, aunque haya escrito algo antes de cambiar la opción.
    companyName: isCompany ? optionalText(elements.quoteCompany) : undefined,
    companyRut: isCompany ? optionalText(elements.quoteRut) : undefined,
    notes: optionalText(elements.quoteNotes),
    items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
  };
}

// onBackToCatalog cierra el panel y vuelve a mostrar el catálogo.
export function attachQuoteEvents(elements: AppElements, onBackToCatalog: () => void): void {
  elements.quoteItemsList.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>("button[data-action]");
    const productId = button?.closest<HTMLElement>(".quote-item")?.dataset.productId;
    if (!button || !productId) return;

    const item = readQuoteList().find((current) => current.productId === productId);
    if (!item) return;
    const action = button.dataset.action as QuoteAction;
    if (action === "remove") {
      removeFromQuoteList(productId);
    } else {
      setQuoteQuantity(productId, action === "increase" ? item.quantity + 1 : item.quantity - 1);
    }
    renderQuoteList(elements);
  });

  // La cantidad escrita a mano se guarda al salir del campo o al presionar Enter.
  elements.quoteItemsList.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLInputElement) || !event.target.classList.contains("quote-qty-input")) return;
    const productId = event.target.closest<HTMLElement>(".quote-item")?.dataset.productId;
    if (!productId) return;
    const quantity = Number(event.target.value);
    setQuoteQuantity(productId, Number.isFinite(quantity) && quantity >= 1 ? quantity : 1);
    renderQuoteList(elements);
  });

  elements.quoteForm.addEventListener("input", () => setFormMessage(elements, ""));
  elements.quoteForm.addEventListener("change", (event) => {
    if (event.target instanceof HTMLInputElement && event.target.name === "quoteCustomerType") {
      updateCompanyFields(elements);
    }
  });
  updateCompanyFields(elements);

  elements.quoteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = readQuoteForm(elements);
    if (typeof input === "string") {
      setFormMessage(elements, input, "error");
      return;
    }

    const button = elements.quoteForm.querySelector<HTMLButtonElement>("button[type=submit]");
    if (button) button.disabled = true;
    setFormMessage(elements, "Enviando cotización...");
    try {
      const quote = await createQuote(input);
      clearQuoteList();
      // Se mantienen nombre y datos de contacto para una próxima cotización; el comentario se borra.
      elements.quoteNotes.value = "";
      setFormMessage(elements, "");
      renderQuoteList(elements);
      showResult(elements, quote);
      elements.quotePanel.scrollIntoView({ block: "start" });
    } catch (error) {
      setFormMessage(elements, getErrorMessage(error, "No se pudo enviar la cotización."), "error");
    } finally {
      if (button) button.disabled = false;
    }
  });

  elements.quoteResult.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("[data-action='back-to-catalog']")) {
      onBackToCatalog();
    }
  });

  elements.closeQuoteBtn.addEventListener("click", onBackToCatalog);
}
