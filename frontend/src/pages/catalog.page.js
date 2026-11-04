import { addProductToCart } from "../components/cart.js";
import { loadProducts } from "../components/catalog.js";
import { isLoggedIn } from "../services/sessionService.js";

// onLoginRequired se llama cuando un visitante sin sesión intenta agregar un producto al carrito.
export function createCatalogPage(elements, state, setStatus, onLoginRequired) {
  const addProduct = (product) => (isLoggedIn()
    ? addProductToCart(product, elements, state, setStatus)
    : onLoginRequired(product));

  return {
    load: () => loadProducts({
      productsGrid: elements.productsGrid,
      categoriesContainer: elements.categoriesContainer,
      setStatus,
      onAddToCart: addProduct,
    }),
    addProduct,
  };
}
