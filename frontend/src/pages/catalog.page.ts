import { addProductToCart } from "../components/cart";
import { attachCatalogControls, type CatalogOptions, loadProducts } from "../components/catalog";
import type { AppElements } from "../elements";
import { addToQuoteList } from "../services/quoteListService";
import type { AppState } from "../state/appState";
import type { Product } from "../types/api";
import type { SetStatus } from "../types/ui";

// onViewQuote abre el panel de cotización (lo maneja app.ts, que controla qué panel se ve).
export function createCatalogPage(elements: AppElements, state: AppState, setStatus: SetStatus, onViewQuote: () => void) {
  const addProduct = (product: Product, quantity: number) => addProductToCart(product, quantity, elements, state, setStatus);
  const addToQuote = (product: Product, quantity: number) => {
    addToQuoteList(product, quantity);
    setStatus(`${product.name} agregado a la cotización${quantity > 1 ? ` (${quantity} unidades)` : ""}.`, "success");
  };
  const options: CatalogOptions = {
    productsGrid: elements.productsGrid,
    categoriesContainer: elements.categoriesContainer,
    searchForm: elements.productSearchForm,
    searchInput: elements.productSearch,
    categoriesToggle: elements.categoriesToggle,
    viewButtons: document.querySelectorAll<HTMLButtonElement>(".view-toggle-btn"),
    setStatus,
    onAddToCart: addProduct,
    onAddToQuote: addToQuote,
    onViewQuote,
  };
  attachCatalogControls(options);

  return {
    load: () => loadProducts(options),
    addProduct,
  };
}
