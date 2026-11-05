import { CATALOG_VIEW_KEY } from "../config/constants.js";
import { getCategories } from "../services/categoriesService.js";
import { getProducts } from "../services/productsService.js";
import { escapeHtml, formatPrice } from "../utils/formatters.js";

// Se usa cuando un producto no tiene imagen guardada en la base de datos.
const DEFAULT_PRODUCT_IMAGE = "images/producto-sin-imagen.svg";
const LOAD_ERROR_MESSAGE = "No pudimos cargar el catálogo. Revisa tu conexión e inténtalo nuevamente.";
const SKELETON_CATEGORIES = 6;
const SKELETON_PRODUCTS = 6;
const CHEVRON_ICON = '<svg class="category-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// Datos del catálogo cargado y la categoría o grupo elegido en la barra lateral.
const catalog = { categories: [], products: [], selection: null };

function productMarkup(product) {
  const name = escapeHtml(product.name);
  const image = escapeHtml(product.imageUrl || DEFAULT_PRODUCT_IMAGE);

  return `<article class="product-card">
    <img class="product-image" src="${image}" alt="${name}" />
    <h2>${name}</h2>
    <p class="product-price">${formatPrice(product.price)}</p>
    <p class="product-quantity"><strong>${product.stock}</strong> unidades disponibles</p>
    <button class="button add-to-cart-btn" type="button" data-product-id="${escapeHtml(product.id)}">Agregar al carrito</button>
  </article>`;
}

// Marcadores grises que ocupan el lugar de categorías y productos mientras responde la API.
function renderSkeleton(categoriesContainer, productsGrid) {
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

function renderMessage(productsGrid, message) {
  productsGrid.innerHTML = message ? `<p class="catalog-message">${escapeHtml(message)}</p>` : "";
}

export function renderProducts(productsGrid, products, onAddToCart, emptyMessage = "") {
  if (!products.length) {
    renderMessage(productsGrid, emptyMessage);
    return;
  }

  productsGrid.innerHTML = products.map(productMarkup).join("");
  productsGrid.querySelectorAll(".add-to-cart-btn").forEach((button) => button.addEventListener("click", () => {
    const product = products.find((item) => String(item.id) === button.dataset.productId);
    if (product) onAddToCart(product);
  }));
}

function countLabel(count) {
  return `${count} ${count === 1 ? "producto" : "productos"}`;
}

// Sin mayúsculas ni tildes, para que "cañeria" encuentre "Cañería".
function normalizeText(text) {
  return String(text ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// Categorías sueltas (Goteros) y grupos con sus subcategorías, cada una con su cantidad de productos.
function buildCategoryTree(categories, products) {
  const counts = new Map();
  products.forEach((product) => counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1));

  const tree = [];
  const groups = new Map();
  categories.forEach((category) => {
    const item = { ...category, count: counts.get(category.id) ?? 0 };
    if (!category.groupName) {
      tree.push(item);
      return;
    }
    if (!groups.has(category.groupName)) {
      const group = { groupName: category.groupName, count: 0, categories: [] };
      groups.set(category.groupName, group);
      tree.push(group);
    }
    const group = groups.get(category.groupName);
    group.categories.push(item);
    group.count += item.count;
  });
  return tree;
}

function categoryLinkMarkup(category) {
  return `<li><button class="category-link" type="button" data-category-id="${escapeHtml(category.id)}">
    <span>${escapeHtml(category.name)}</span><span class="category-count">${category.count}</span>
  </button></li>`;
}

function categoryGroupMarkup(group) {
  const name = escapeHtml(group.groupName);
  return `<li class="category-group">
    <div class="category-group-header">
      <button class="category-link" type="button" data-group-name="${name}">
        <span>${name}</span><span class="category-count">${group.count}</span>
      </button>
      <button class="category-expand" type="button" aria-expanded="false" aria-label="Ver subcategorías de ${name}">${CHEVRON_ICON}</button>
    </div>
    <ul class="category-subtree hidden">${group.categories.map(categoryLinkMarkup).join("")}</ul>
  </li>`;
}

function renderCategoryTree(categoriesContainer) {
  const tree = buildCategoryTree(catalog.categories, catalog.products);
  categoriesContainer.innerHTML = `<ul class="category-tree">${tree
    .map((item) => (item.categories ? categoryGroupMarkup(item) : categoryLinkMarkup(item)))
    .join("")}</ul>`;
}

function setGroupExpanded(groupItem, expanded) {
  groupItem.classList.toggle("expanded", expanded);
  groupItem.querySelector(".category-expand").setAttribute("aria-expanded", String(expanded));
  groupItem.querySelector(".category-subtree").classList.toggle("hidden", !expanded);
}

function markActiveCategory(categoriesContainer, selection) {
  categoriesContainer.querySelectorAll(".category-link").forEach((link) => {
    const isActive = Boolean(selection) && (selection.categoryId
      ? link.dataset.categoryId === selection.categoryId
      : link.dataset.groupName === selection.groupName);
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "true");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

// Un grupo muestra los productos de todas sus subcategorías.
function productsForSelection(selection) {
  if (selection.categoryId) {
    return catalog.products.filter((product) => product.categoryId === selection.categoryId);
  }
  const categoryIds = new Set(catalog.categories
    .filter((category) => category.groupName === selection.groupName)
    .map((category) => category.id));
  return catalog.products.filter((product) => categoryIds.has(product.categoryId));
}

// Si hay texto en el buscador se busca en todo el catálogo; si no, se muestra la categoría elegida.
function showProducts(options) {
  const { productsGrid, categoriesContainer, searchInput, setStatus, onAddToCart } = options;
  const searchText = searchInput.value.trim();
  const term = normalizeText(searchText);
  markActiveCategory(categoriesContainer, term ? null : catalog.selection);

  if (term) {
    const results = catalog.products.filter((product) => normalizeText(product.name).includes(term));
    renderProducts(productsGrid, results, onAddToCart, `No encontramos productos para "${searchText}".`);
    setStatus(results.length ? `${countLabel(results.length)} para "${searchText}"` : "", results.length ? "success" : "info");
    return;
  }

  if (!catalog.selection) {
    productsGrid.innerHTML = "";
    setStatus(catalog.categories.length ? "Selecciona una categoría o busca un producto." : "Todavía no hay categorías disponibles.");
    return;
  }

  const products = productsForSelection(catalog.selection);
  renderProducts(productsGrid, products, onAddToCart, "Todavía no hay productos en esta categoría.");
  setStatus(`Mostrando ${countLabel(products.length)}`, "success");
}

function readSavedView() {
  try {
    return window.localStorage.getItem(CATALOG_VIEW_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

function applyView(options, view) {
  options.productsGrid.classList.toggle("products-list", view === "list");
  options.viewButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.view === view)));
}

// En celular la lista de categorías se pliega bajo el botón "Categorías".
function setCategoriesOpen(options, open) {
  options.categoriesToggle.setAttribute("aria-expanded", String(open));
  options.categoriesToggle.closest(".catalog-sidebar").classList.toggle("categories-open", open);
}

// Los eventos se conectan una sola vez; recargar el catálogo solo cambia los datos.
export function attachCatalogControls(options) {
  const { categoriesContainer, searchForm, searchInput, categoriesToggle, viewButtons } = options;

  categoriesContainer.addEventListener("click", (event) => {
    const expandButton = event.target.closest(".category-expand");
    if (expandButton) {
      setGroupExpanded(expandButton.closest(".category-group"), expandButton.getAttribute("aria-expanded") !== "true");
      return;
    }

    const link = event.target.closest(".category-link");
    if (!link) return;
    catalog.selection = link.dataset.categoryId ? { categoryId: link.dataset.categoryId } : { groupName: link.dataset.groupName };
    const groupItem = link.closest(".category-group");
    if (groupItem) setGroupExpanded(groupItem, true);
    searchInput.value = "";
    showProducts(options);
    // En celular se cierra la lista para que se vean los productos elegidos.
    if (categoriesToggle.offsetParent !== null) setCategoriesOpen(options, false);
  });

  searchInput.addEventListener("input", () => showProducts(options));
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    showProducts(options);
  });

  categoriesToggle.addEventListener("click", () => {
    setCategoriesOpen(options, categoriesToggle.getAttribute("aria-expanded") !== "true");
  });

  viewButtons.forEach((button) => button.addEventListener("click", () => {
    applyView(options, button.dataset.view);
    try {
      window.localStorage.setItem(CATALOG_VIEW_KEY, button.dataset.view);
    } catch {
      // Sin almacenamiento la vista elegida solo dura mientras la página esté abierta.
    }
  }));
  applyView(options, readSavedView());
}

// Si la API falla no se muestran productos de ejemplo: el cliente podría ver precios o stock que no existen.
function renderLoadError(options) {
  const { productsGrid, categoriesContainer, setStatus } = options;
  categoriesContainer.innerHTML = "";
  productsGrid.innerHTML = `<div class="catalog-message catalog-error">
    <p>${LOAD_ERROR_MESSAGE}</p>
    <button class="button" type="button">Reintentar</button>
  </div>`;
  productsGrid.querySelector("button").addEventListener("click", () => loadProducts(options));
  setStatus(LOAD_ERROR_MESSAGE, "error");
}

export async function loadProducts(options) {
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

    renderCategoryTree(categoriesContainer);
    showProducts(options);
  } catch (error) {
    console.error(error);
    productsGrid.removeAttribute("aria-busy");
    renderLoadError(options);
  }
}
