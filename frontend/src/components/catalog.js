import { getCategories } from "../services/categoriesService.js";
import { getProducts } from "../services/productsService.js";
import { escapeHtml, formatPrice } from "../utils/formatters.js";

// Se usa cuando un producto no tiene imagen guardada en la base de datos.
const DEFAULT_PRODUCT_IMAGE = "images/producto-sin-imagen.svg";
const LOAD_ERROR_MESSAGE = "No pudimos cargar el catálogo. Revisa tu conexión e inténtalo nuevamente.";

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

const SKELETON_CATEGORIES = 4;
const SKELETON_PRODUCTS = 6;

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

function categoryButtonMarkup(category) {
  return `<button
    class="category-button"
    type="button"
    data-category-id="${escapeHtml(category.id)}"
  >${escapeHtml(category.name)}</button>`;
}

// Las categorías de un mismo grupo (por ejemplo, Abrazaderas) se eligen desde un select.
function categoryGroupMarkup(groupName, categories) {
  const options = categories.map((category) => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.name)}</option>`).join("");
  return `<select class="category-button category-select" aria-label="${escapeHtml(groupName)}">
    <option value="" selected disabled hidden>${escapeHtml(groupName)}</option>
    ${options}
  </select>`;
}

export function renderCategories(categoriesContainer, categories, onCategorySelected) {
  const groups = new Map();
  const markup = [];

  categories.forEach((category) => {
    if (!category.groupName) {
      markup.push(categoryButtonMarkup(category));
      return;
    }
    if (!groups.has(category.groupName)) {
      groups.set(category.groupName, []);
      markup.push(category.groupName);
    }
    groups.get(category.groupName).push(category);
  });

  categoriesContainer.innerHTML = markup
    .map((item) => (groups.has(item) ? categoryGroupMarkup(item, groups.get(item)) : item))
    .join("");

  const controls = categoriesContainer.querySelectorAll(".category-button");
  const selectControl = (control, categoryId) => {
    controls.forEach((item) => {
      item.classList.remove("active");
      if (item !== control && item.tagName === "SELECT") item.value = "";
    });
    control.classList.add("active");
    onCategorySelected(categoryId);
  };

  controls.forEach((control) => {
    if (control.tagName === "SELECT") {
      control.addEventListener("change", () => selectControl(control, control.value));
    } else {
      control.addEventListener("click", () => selectControl(control, control.dataset.categoryId));
    }
  });
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
  const { productsGrid, categoriesContainer, setStatus, onAddToCart } = options;

  setStatus("Cargando productos...");
  renderSkeleton(categoriesContainer, productsGrid);
  try {
    const [categories, products] = await Promise.all([getCategories(), getProducts()]);
    productsGrid.removeAttribute("aria-busy");

    renderCategories(categoriesContainer, categories ?? [], (categoryId) => {
      const filteredProducts = (products ?? []).filter((product) => product.categoryId === categoryId);
      renderProducts(productsGrid, filteredProducts, onAddToCart, "Todavía no hay productos en esta categoría.");
      setStatus(`Mostrando ${filteredProducts.length} productos`, "success");
    });

    productsGrid.innerHTML = "";
    setStatus(categories?.length ? "Selecciona una categoría para ver sus productos." : "Todavía no hay categorías disponibles.");
  } catch (error) {
    console.error(error);
    productsGrid.removeAttribute("aria-busy");
    renderLoadError(options);
  }
}
