import { addProductToCart } from "../components/cart.js";
import { loadProducts, renderProducts } from "../components/catalog.js";
import { isLoggedIn } from "../services/sessionService.js";

export function createCatalogPage(elements, state, setStatus) {
  const addProduct = (product) => addProductToCart(product, elements, state, setStatus);

  return {
    load: () => loadProducts({
      productsGrid: elements.productsGrid,
      categoriesContainer: elements.categoriesContainer,
      isLoggedIn,
      setStatus,
      onAddToCart: addProduct,
    }),
    addProduct,
    renderFallback: () => {
      elements.categoriesContainer.innerHTML = "";
      renderProducts(elements.productsGrid, [], addProduct);
    },
  };
}