import type { Category, Product } from "../types/api";
import { escapeHtml, normalizeText } from "../utils/formatters";

// Tabla de precios y stock del panel de administración, separada por categoría.
// Usa los mismos grupos que la barra lateral del catálogo: una sección por categoría suelta (Goteros)
// o por grupo (Abrazaderas), y dentro del grupo una tabla por subcategoría (Reforzadas, Reforzadas Inoxidable).

interface ProductTable {
  // Subcategoría; null cuando la sección es una categoría suelta y no necesita subtítulo.
  title: string | null;
  products: Product[];
}

interface ProductSection {
  title: string;
  tables: ProductTable[];
  count: number;
}

const UNCATEGORIZED = "Sin categoría";

const CHEVRON_ICON = '<svg class="admin-category-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function byName(a: Product, b: Product): number {
  return a.name.localeCompare(b.name, "es");
}

// Arma las secciones en el mismo orden en que llegan las categorías. Las categorías sin productos no se muestran.
function buildSections(categories: Category[], products: Product[]): ProductSection[] {
  const productsByCategory = new Map<string, Product[]>();
  products.forEach((product) => {
    const list = productsByCategory.get(product.categoryId) ?? [];
    list.push(product);
    productsByCategory.set(product.categoryId, list);
  });

  const sections: ProductSection[] = [];
  const groups = new Map<string, ProductSection>();
  categories.forEach((category) => {
    const categoryProducts = (productsByCategory.get(category.id) ?? []).sort(byName);
    productsByCategory.delete(category.id);
    if (!categoryProducts.length) return;

    if (!category.groupName) {
      sections.push({ title: category.name, tables: [{ title: null, products: categoryProducts }], count: categoryProducts.length });
      return;
    }
    let group = groups.get(category.groupName);
    if (!group) {
      group = { title: category.groupName, tables: [], count: 0 };
      groups.set(category.groupName, group);
      sections.push(group);
    }
    group.tables.push({ title: category.name, products: categoryProducts });
    group.count += categoryProducts.length;
  });

  // Productos cuya categoría ya no existe: se muestran al final para que igual se puedan editar.
  const orphans = [...productsByCategory.values()].flat().sort(byName);
  if (orphans.length) {
    sections.push({ title: UNCATEGORIZED, tables: [{ title: null, products: orphans }], count: orphans.length });
  }
  return sections;
}

function productRowMarkup(product: Product): string {
  const name = escapeHtml(product.name);
  return `<tr data-product-id="${escapeHtml(product.id)}" data-search="${escapeHtml(normalizeText(product.name))}">
      <td>${name}</td>
      <td><input class="admin-product-price" type="number" min="1" step="1" value="${Number(product.price)}" aria-label="Precio de ${name}" /></td>
      <td><input class="admin-product-stock" type="number" min="0" step="1" value="${Number(product.stock)}" aria-label="Stock de ${name}" /></td>
      <td><button class="button small admin-save-product" type="button">Guardar</button></td>
    </tr>`;
}

function tableMarkup(table: ProductTable): string {
  const title = table.title
    ? `<h4 class="admin-subcategory-title">${escapeHtml(table.title)} <span class="admin-count">${table.products.length}</span></h4>`
    : "";
  return `<div class="admin-subcategory">
    ${title}
    <div class="admin-table-wrapper"><table class="admin-table">
      <thead><tr><th>Producto</th><th>Precio</th><th>Stock</th><th>Acción</th></tr></thead>
      <tbody>${table.products.map(productRowMarkup).join("")}</tbody>
    </table></div>
  </div>`;
}

function sectionMarkup(section: ProductSection): string {
  return `<details class="admin-category">
    <summary>
      ${CHEVRON_ICON}
      <span class="admin-category-name">${escapeHtml(section.title)}</span>
      <span class="admin-count">${section.count} ${section.count === 1 ? "producto" : "productos"}</span>
    </summary>
    <div class="admin-category-body">${section.tables.map(tableMarkup).join("")}</div>
  </details>`;
}

export function renderAdminProducts(container: HTMLElement, categories: Category[], products: Product[]): void {
  if (!products.length) {
    container.innerHTML = '<p class="admin-empty">No hay productos disponibles.</p>';
    return;
  }

  container.innerHTML = `<label class="admin-product-search">
      <span class="visually-hidden">Buscar producto en el panel</span>
      <input type="search" placeholder="Buscar producto para editar..." autocomplete="off" />
    </label>
    <p class="admin-empty admin-search-empty hidden">No hay productos con ese nombre.</p>
    <div class="admin-categories">${buildSections(categories, products).map(sectionMarkup).join("")}</div>`;
}

// Muestra solo las filas cuyo nombre contiene el texto y abre las secciones donde hay coincidencias.
// Con el buscador vacío se vuelven a mostrar todas las filas y se cierran las secciones.
function filterProducts(container: HTMLElement, searchText: string): void {
  const term = normalizeText(searchText);
  let matches = 0;

  container.querySelectorAll<HTMLDetailsElement>(".admin-category").forEach((section) => {
    let sectionMatches = 0;
    section.querySelectorAll<HTMLElement>(".admin-subcategory").forEach((table) => {
      let tableMatches = 0;
      table.querySelectorAll<HTMLTableRowElement>("tbody tr").forEach((row) => {
        const visible = !term || (row.dataset.search ?? "").includes(term);
        row.classList.toggle("hidden", !visible);
        if (visible) tableMatches += 1;
      });
      table.classList.toggle("hidden", tableMatches === 0);
      sectionMatches += tableMatches;
    });
    section.classList.toggle("hidden", sectionMatches === 0);
    section.open = Boolean(term) && sectionMatches > 0;
    matches += sectionMatches;
  });

  container.querySelector(".admin-search-empty")?.classList.toggle("hidden", matches > 0);
}

// Escribe el nombre en el buscador del panel para mostrar ese producto (por ejemplo, recién creado).
export function showAdminProduct(container: HTMLElement, name: string): void {
  const search = container.querySelector<HTMLInputElement>("input[type=search]");
  if (!search) return;
  search.value = name;
  filterProducts(container, name);
}

// Se conecta una sola vez: el buscador se vuelve a dibujar con la tabla, pero el evento "input" sube al contenedor.
export function attachAdminProductSearch(container: HTMLElement): void {
  container.addEventListener("input", (event) => {
    if (event.target instanceof HTMLInputElement && event.target.type === "search") {
      filterProducts(container, event.target.value);
    }
  });
}
