import { addProductToCart } from "../components/cart";
import { attachCatalogControls, type CatalogOptions, loadProducts } from "../components/catalog";
import type { AppElements } from "../elements";
import type { AppState } from "../state/appState";
import type { Product } from "../types/api";
import type { SetStatus } from "../types/ui";

export function createCatalogPage(elements: AppElements, state: AppState, setStatus: SetStatus) {
  const addProduct = (product: Product) => addProductToCart(product, elements, state, setStatus);
  const options: CatalogOptions = {
    productsGrid: elements.productsGrid,
    categoriesContainer: elements.categoriesContainer,
    searchForm: elements.productSearchForm,
    searchInput: elements.productSearch,
    categoriesToggle: elements.categoriesToggle,
    viewButtons: document.querySelectorAll<HTMLButtonElement>(".view-toggle-btn"),
    setStatus,
    onAddToCart: addProduct,
  };
  attachCatalogControls(options);

  return {
    load: () => loadProducts(options),
    addProduct,
  };
}
