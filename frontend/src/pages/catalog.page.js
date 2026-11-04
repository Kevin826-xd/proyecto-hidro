import { addProductToCart } from "../components/cart.js";
import { loadProducts } from "../components/catalog.js";

export function createCatalogPage(elements, state, setStatus) {
  const addProduct = (product) => addProductToCart(product, elements, state, setStatus);

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
