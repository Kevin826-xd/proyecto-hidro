import { getCategories } from "../services/categoriesService";
import { getProducts } from "../services/productsService";
import { isInQuoteList, MAX_QUOTE_QUANTITY, QUOTE_LIST_CHANGED_EVENT } from "../services/quoteListService";
import type { Category, Product } from "../types/api";
import type { SetStatus } from "../types/ui";
import { escapeHtml, formatPrice, normalizeText } from "../utils/formatters";
import { attachViewToggle } from "./catalogView";
import {
  attachCategoriesToggle,
  attachCategoryTreeEvents,
  type CategorySelection,
  isCategoriesToggleVisible,
  markActiveCategory,
  productsInSelection,
  renderCategoryTree,
  setCategoriesOpen,
} from "./categoryTree";

export interface CatalogOptions {
  productsGrid: HTMLElement;
  categoriesContainer: HTMLElement;
  searchForm: HTMLFormElement;
  searchInput: HTMLInputElement;
  categoriesToggle: HTMLButtonElement;
  viewButtons: NodeListOf<HTMLButtonElement>;
  setStatus: SetStatus;
  // quantity es lo que el cliente eligió en el selector de cantidad de la tarjeta.
  onAddToCart: (product: Product, quantity: number) => void;
  onAddToQuote: (product: Product, quantity: number) => void;
  onViewQuote: () => void;
}

// Se usa cuando un producto no tiene imagen guardada en la base de datos.
const DEFAULT_PRODUCT_IMAGE = "images/producto-sin-imagen.svg";
const LOAD_ERROR_MESSAGE = "No pudimos cargar el catálogo. Revisa tu conexión e inténtalo nuevamente.";
const SKELETON_CATEGORIES = 6;
const SKELETON_PRODUCTS = 6;

// Datos del catálogo cargado y la categoría o grupo elegido en la barra lateral.
const catalog: { categories: Category[]; products: Product[]; selection: CategorySelection | null } = {
  categories: [],
  products: [],
  selection: null,
};

// Sin stock no se puede comprar, pero sí cotizar (la empresa puede conseguir el producto).
function productMarkup(product: Product): string {
  const name = escapeHtml(product.name);
  const image = escapeHtml(product.imageUrl || DEFAULT_PRODUCT_IMAGE);
  const stock = Number(product.stock);
  const outOfStock = stock < 1;

  return `<article class="product-card" data-product-id="${escapeHtml(product.id)}">
    <img class="product-image" src="${image}" alt="${name}" />
    <h2>${name}</h2>
    <p class="product-price">${formatPrice(product.price)}</p>
    <p class="product-quantity"><strong>${stock}</strong> unidades disponibles</p>
    <div class="product-actions">
      <div class="product-buy-row">
        <input class="product-qty-input" type="number" min="1" max="${MAX_QUOTE_QUANTITY}" step="1" value="1" inputmode="numeric" aria-label="Cantidad de ${name}" />
        <button class="button add-to-cart-btn" type="button" ${outOfStock ? "disabled" : ""}>${outOfStock ? "Sin stock" : "Agregar al carrito"}</button>
      </div>
      <button class="button button-outline add-to-quote-btn" type="button">Agregar a cotización</button>
      <button class="view-quote-link ${isInQuoteList(product.id) ? "" : "hidden"}" type="button">Ver cotización</button>
    </div>
  </article>`;
}

// Cantidad elegida en la tarjeta; si el campo quedó vacío o con un valor inválido, se usa 1.
function readCardQuantity(card: Element): number {
  const value = Number(card.querySelector<HTMLInputElement>(".product-qty-input")?.value);
  return Number.isInteger(value) && value >= 1 ? Math.min(value, MAX_QUOTE_QUANTITY) : 1;
}

// Muestra "Ver cotización" en las tarjetas de los productos que están en la lista de cotización.
function updateQuoteLinks(productsGrid: HTMLElement): void {
  productsGrid.querySelectorAll<HTMLElement>(".product-card[data-product-id]").forEach((card) => {
    card.querySelector(".view-quote-link")?.classList.toggle("hidden", !isInQuoteList(card.dataset.productId ?? ""));
  });
}

// Marcadores grises que ocupan el lugar de categorías y productos mientras responde la API.
function renderSkeleton(categoriesContainer: HTMLElement, productsGrid: HTMLElement): void {
  categoriesContainer.innerHTML = '<span class="skeleton skeleton-category"></span>'.repeat(SKELETON_CATEGORIES);
  productsGrid.innerHTML = `<article class="product-card skeleton-card" aria-hidden="true">
    <div class="skeleton skeleton-image"></div>
    <div class="skeleton skeleton-line skeleton-title"></div>
    <div class="skeleton skeleton-line skeleton-price"></div>
    <div class="skeleton skeleton-line skeleton-stock"></div>
    <div class="skeleton skeleton-button"></div>
  </article>`.repeat(SKELETON_PRODUCTS);
  productsGrid.setAttribute("aria-busy", "true");
}

function renderMessage(productsGrid: HTMLElement, message: string): void {
  productsGrid.innerHTML = message ? `<p class="catalog-message">${escapeHtml(message)}</p>` : "";
}

// Los botones de las tarjetas se atienden en attachCatalogControls (un solo evento para toda la grilla).
function renderProducts(productsGrid: HTMLElement, products: Product[], emptyMessage = ""): void {
  if (!products.length) {
    renderMessage(productsGrid, emptyMessage);
    return;
  }

  productsGrid.innerHTML = products.map(productMarkup).join("");
}

function countLabel(count: number): string {
  return `${count} ${count === 1 ? "producto" : "productos"}`;
}

// Si hay texto en el buscador se busca en todo el catálogo; si no, se muestra la categoría elegida.
function showProducts(options: CatalogOptions): void {
  const { productsGrid, categoriesContainer, searchInput, setStatus } = options;
  const searchText = searchInput.value.trim();
  const term = normalizeText(searchText);
  markActiveCategory(categoriesContainer, term ? null : catalog.selection);

  if (term) {
    const results = catalog.products.filter((product) => normalizeText(product.name).includes(term));
    renderProducts(productsGrid, results, `No encontramos productos para "${searchText}".`);
    setStatus(results.length ? `${countLabel(results.length)} para "${searchText}"` : "", results.length ? "success" : "info");
    return;
  }

  if (!catalog.selection) {
    productsGrid.innerHTML = "";
    setStatus(catalog.categories.length ? "Selecciona una categoría o busca un producto." : "Todavía no hay categorías disponibles.");
    return;
  }

  const products = productsInSelection(catalog.selection, catalog.categories, catalog.products);
  renderProducts(productsGrid, products, "Todavía no hay productos en esta categoría.");
  setStatus(`Mostrando ${countLabel(products.length)}`, "success");
}

// Los eventos se conectan una sola vez; recargar el catálogo solo cambia los datos.
export function attachCatalogControls(options: CatalogOptions): void {
  const { categoriesContainer, searchForm, searchInput, categoriesToggle, productsGrid, viewButtons } = options;

  attachCategoryTreeEvents(categoriesContainer, (selection) => {
    catalog.selection = selection;
    searchInput.value = "";
    showProducts(options);
    // En celular se cierra la lista para que se vean los productos elegidos.
    if (isCategoriesToggleVisible(categoriesToggle)) setCategoriesOpen(categoriesToggle, false);
  });
  attachCategoriesToggle(categoriesToggle);

  searchInput.addEventListener("input", () => showProducts(options));
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    showProducts(options);
  });

  attachViewToggle(productsGrid, viewButtons);

  // Botones de las tarjetas de producto.
  productsGrid.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>("button");
    const card = button?.closest<HTMLElement>(".product-card[data-product-id]");
    const product = catalog.products.find((item) => item.id === card?.dataset.productId);
    if (!button || !card || !product) return;

    if (button.classList.contains("add-to-cart-btn")) {
      options.onAddToCart(product, readCardQuantity(card));
    } else if (button.classList.contains("add-to-quote-btn")) {
      options.onAddToQuote(product, readCardQuantity(card));
    } else if (button.classList.contains("view-quote-link")) {
      options.onViewQuote();
    }
  });

  // Si la lista de cotización cambia (por ejemplo, se quita un producto desde el panel), se actualizan los enlaces.
  window.addEventListener(QUOTE_LIST_CHANGED_EVENT, () => updateQuoteLinks(productsGrid));
}

// Si la API falla no se muestran productos de ejemplo: el cliente podría ver precios o stock que no existen.
function renderLoadError(options: CatalogOptions): void {
  const { productsGrid, categoriesContainer, setStatus } = options;
  categoriesContainer.innerHTML = "";
  productsGrid.innerHTML = `<div class="catalog-message catalog-error">
    <p>${LOAD_ERROR_MESSAGE}</p>
    <button class="button" type="button">Reintentar</button>
  </div>`;
  productsGrid.querySelector("button")?.addEventListener("click", () => loadProducts(options));
  setStatus(LOAD_ERROR_MESSAGE, "error");
}

export async function loadProducts(options: CatalogOptions): Promise<void> {
  const { productsGrid, categoriesContainer, searchInput, setStatus } = options;

  setStatus("Cargando productos...");
  renderSkeleton(categoriesContainer, productsGrid);
  try {
    const [categories, products] = await Promise.all([getCategories(), getProducts()]);
    productsGrid.removeAttribute("aria-busy");
    catalog.categories = categories ?? [];
    catalog.products = products ?? [];
    catalog.selection = null;
    searchInput.value = "";

    renderCategoryTree(categoriesContainer, catalog.categories, catalog.products);
    showProducts(options);
  } catch (error) {
    console.error(error);
    productsGrid.removeAttribute("aria-busy");
    renderLoadError(options);
  }
}
