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

export function renderCategories(categoriesContainer, categories, onCategorySelected) {
  categoriesContainer.innerHTML = categories.map((category) => `<button
    class="category-button"
    type="button"
    data-category-id="${escapeHtml(category.id)}"
  >${escapeHtml(category.name)}</button>`).join("");

  categoriesContainer.querySelectorAll(".category-button").forEach((button) => {
    button.addEventListener("click", () => {
      categoriesContainer.querySelectorAll(".category-button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      onCategorySelected(button.dataset.categoryId);
    });
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
  const { productsGrid, categoriesContainer, isLoggedIn, setStatus, onAddToCart } = options;

  if (!isLoggedIn()) {
    renderProducts(productsGrid, [], onAddToCart);
    return;
  }

  setStatus("Cargando productos...");
  try {
    const [categories, products] = await Promise.all([getCategories(), getProducts()]);

    renderCategories(categoriesContainer, categories ?? [], (categoryId) => {
      const filteredProducts = (products ?? []).filter((product) => product.categoryId === categoryId);
      renderProducts(productsGrid, filteredProducts, onAddToCart, "Todavía no hay productos en esta categoría.");
      setStatus(`Mostrando ${filteredProducts.length} productos`, "success");
    });

    productsGrid.innerHTML = "";
    setStatus(categories?.length ? "Selecciona una categoría para ver sus productos." : "Todavía no hay categorías disponibles.");
  } catch (error) {
    console.error(error);
    renderLoadError(options);
  }
}
