import { FALLBACK_CATEGORIES, FALLBACK_PRODUCTS } from "../config/constants.js";
import { getCategories } from "../services/categoriesService.js";
import { getProducts } from "../services/productsService.js";

const goteroImage = "assets/gotero.svg";

function productMarkup(product) {
  return `<article class="product-card">
    <img class="product-image" src="${goteroImage}" alt="${product.name}" />
    <h2>Gotero</h2>
    <p class="product-quantity"><strong>${product.stock}</strong> goteros disponibles</p>
    <button class="button add-to-cart-btn" type="button" data-product-id="${product.id}" data-product-name="${product.name}" data-product-price="${product.price}">Agregar al carrito</button>
  </article>`;
}

export function renderProducts(productsGrid, products, onAddToCart) {
  const visibleProducts = Array.isArray(products) && products.length ? products : FALLBACK_PRODUCTS;
  productsGrid.innerHTML = visibleProducts.map(productMarkup).join("");
  productsGrid.querySelectorAll(".add-to-cart-btn").forEach((button) => button.addEventListener("click", () => onAddToCart({
    id: button.dataset.productId,
    name: button.dataset.productName,
    price: Number(button.dataset.productPrice),
  })));
}

export function renderCategories(categoriesContainer, categories, onCategorySelected) {
  categoriesContainer.innerHTML = categories.map((category) => `<button
    class="category-button"
    type="button"
    data-category-id="${category.id}"
  >${category.name}</button>`).join("");

  categoriesContainer.querySelectorAll(".category-button").forEach((button) => {
    button.addEventListener("click", () => {
      categoriesContainer.querySelectorAll(".category-button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      onCategorySelected(button.dataset.categoryId);
    });
  });
}

export async function loadProducts({ productsGrid, categoriesContainer, isLoggedIn, setStatus, onAddToCart }) {
  if (!isLoggedIn()) {
    renderProducts(productsGrid, [], onAddToCart);
    return;
  }
  setStatus("Cargando productos...");
  try {
    const [loadedCategories, loadedProducts] = await Promise.all([getCategories(), getProducts()]);
    const categories = (loadedCategories || []).filter((category) => category.name.toLowerCase() === "goteros");
    if (!categories.some((category) => category.name.toLowerCase() === "goteros")) {
      categories.unshift(FALLBACK_CATEGORIES[0]);
    }
    const products = loadedProducts?.length ? loadedProducts : FALLBACK_PRODUCTS;
    renderCategories(categoriesContainer, categories, (categoryId) => {
      const filteredProducts = products.filter((product) => product.categoryId === categoryId);
      renderProducts(productsGrid, filteredProducts, onAddToCart);
      setStatus(`Mostrando ${filteredProducts.length} productos`, "success");
    });
    productsGrid.innerHTML = "";
    setStatus("Selecciona una categoría para ver sus productos.");
  } catch (error) {
    console.error(error);
    renderCategories(categoriesContainer, FALLBACK_CATEGORIES, (categoryId) => {
      renderProducts(productsGrid, FALLBACK_PRODUCTS.filter((product) => product.categoryId === categoryId), onAddToCart);
      setStatus("Mostrando goteros disponibles", "success");
    });
    productsGrid.innerHTML = "";
    setStatus("Selecciona una categoría para ver sus productos.");
  }
}