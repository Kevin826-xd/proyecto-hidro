import { addProductToCart } from "../components/cart.js";
import { attachCatalogControls, loadProducts } from "../components/catalog.js";

export function createCatalogPage(elements, state, setStatus) {
  const addProduct = (product) => addProductToCart(product, elements, state, setStatus);
  const options = {
    productsGrid: elements.productsGrid,
    categoriesContainer: elements.categoriesContainer,
    searchForm: elements.productSearchForm,
    searchInput: elements.productSearch,
    categoriesToggle: elements.categoriesToggle,
    viewButtons: document.querySelectorAll(".view-toggle-btn"),
    setStatus,
    onAddToCart: addProduct,
  };
  attachCatalogControls(options);

  return {
    load: () => loadProducts(options),
    addProduct,
  };
}
