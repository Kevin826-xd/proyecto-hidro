import { CATALOG_VIEW_KEY } from "../config/constants";

// Botones para ver los productos en cuadrícula o en lista. La vista elegida se recuerda en el navegador.

type CatalogView = "grid" | "list";

function readSavedView(): CatalogView {
  try {
    return window.localStorage.getItem(CATALOG_VIEW_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

function saveView(view: CatalogView): void {
  try {
    window.localStorage.setItem(CATALOG_VIEW_KEY, view);
  } catch {
    // Sin almacenamiento la vista elegida solo dura mientras la página esté abierta.
  }
}

function applyView(productsGrid: HTMLElement, viewButtons: NodeListOf<HTMLButtonElement>, view: CatalogView): void {
  productsGrid.classList.toggle("products-list", view === "list");
  viewButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.view === view)));
}

export function attachViewToggle(productsGrid: HTMLElement, viewButtons: NodeListOf<HTMLButtonElement>): void {
  viewButtons.forEach((button) => button.addEventListener("click", () => {
    const view: CatalogView = button.dataset.view === "list" ? "list" : "grid";
    applyView(productsGrid, viewButtons, view);
    saveView(view);
  }));
  applyView(productsGrid, viewButtons, readSavedView());
}
