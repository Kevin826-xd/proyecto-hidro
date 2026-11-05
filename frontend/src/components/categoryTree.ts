import type { Category, Product } from "../types/api";
import { escapeHtml } from "../utils/formatters";

// Árbol de categorías de la barra lateral: categorías sueltas (Goteros) y grupos desplegables
// (Abrazaderas, Bombas...) con sus subcategorías.

// Lo elegido en la barra lateral: una categoría o un grupo completo.
export type CategorySelection = { categoryId: string } | { groupName: string };

interface CategoryItem extends Category {
  count: number;
}

interface CategoryGroup {
  groupName: string;
  count: number;
  categories: CategoryItem[];
}

const CHEVRON_ICON = '<svg class="category-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// Categorías sueltas y grupos con sus subcategorías, cada una con su cantidad de productos.
function buildCategoryTree(categories: Category[], products: Product[]): Array<CategoryItem | CategoryGroup> {
  const counts = new Map<string, number>();
  products.forEach((product) => counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1));

  const tree: Array<CategoryItem | CategoryGroup> = [];
  const groups = new Map<string, CategoryGroup>();
  categories.forEach((category) => {
    const item: CategoryItem = { ...category, count: counts.get(category.id) ?? 0 };
    if (!category.groupName) {
      tree.push(item);
      return;
    }
    let group = groups.get(category.groupName);
    if (!group) {
      group = { groupName: category.groupName, count: 0, categories: [] };
      groups.set(category.groupName, group);
      tree.push(group);
    }
    group.categories.push(item);
    group.count += item.count;
  });
  return tree;
}

function isGroup(item: CategoryItem | CategoryGroup): item is CategoryGroup {
  return "categories" in item;
}

function categoryLinkMarkup(category: CategoryItem): string {
  return `<li><button class="category-link" type="button" data-category-id="${escapeHtml(category.id)}">
    <span>${escapeHtml(category.name)}</span><span class="category-count">${category.count}</span>
  </button></li>`;
}

function categoryGroupMarkup(group: CategoryGroup): string {
  const name = escapeHtml(group.groupName);
  return `<li class="category-group">
    <div class="category-group-header">
      <button class="category-link" type="button" data-group-name="${name}">
        <span>${name}</span><span class="category-count">${group.count}</span>
      </button>
      <button class="category-expand" type="button" aria-expanded="false" aria-label="Ver subcategorías de ${name}">${CHEVRON_ICON}</button>
    </div>
    <ul class="category-subtree hidden">${group.categories.map(categoryLinkMarkup).join("")}</ul>
  </li>`;
}

export function renderCategoryTree(container: HTMLElement, categories: Category[], products: Product[]): void {
  const tree = buildCategoryTree(categories, products);
  container.innerHTML = `<ul class="category-tree">${tree
    .map((item) => (isGroup(item) ? categoryGroupMarkup(item) : categoryLinkMarkup(item)))
    .join("")}</ul>`;
}

function setGroupExpanded(groupItem: Element, expanded: boolean): void {
  groupItem.classList.toggle("expanded", expanded);
  groupItem.querySelector(".category-expand")?.setAttribute("aria-expanded", String(expanded));
  groupItem.querySelector(".category-subtree")?.classList.toggle("hidden", !expanded);
}

// Resalta la categoría o grupo elegido. Sin selección (por ejemplo, al buscar) no resalta ninguno.
export function markActiveCategory(container: HTMLElement, selection: CategorySelection | null): void {
  container.querySelectorAll<HTMLButtonElement>(".category-link").forEach((link) => {
    const isActive = selection !== null && ("categoryId" in selection
      ? link.dataset.categoryId === selection.categoryId
      : link.dataset.groupName === selection.groupName);
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "true");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

// Un grupo muestra los productos de todas sus subcategorías.
export function productsInSelection(selection: CategorySelection, categories: Category[], products: Product[]): Product[] {
  if ("categoryId" in selection) {
    return products.filter((product) => product.categoryId === selection.categoryId);
  }
  const categoryIds = new Set(categories
    .filter((category) => category.groupName === selection.groupName)
    .map((category) => category.id));
  return products.filter((product) => categoryIds.has(product.categoryId));
}

// Los eventos se conectan una sola vez sobre el contenedor; sirven aunque el árbol se vuelva a dibujar.
export function attachCategoryTreeEvents(container: HTMLElement, onSelect: (selection: CategorySelection) => void): void {
  container.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const expandButton = event.target.closest(".category-expand");
    const expandGroup = expandButton?.closest(".category-group");
    if (expandButton && expandGroup) {
      setGroupExpanded(expandGroup, expandButton.getAttribute("aria-expanded") !== "true");
      return;
    }

    const link = event.target.closest<HTMLButtonElement>(".category-link");
    if (!link) return;
    const groupItem = link.closest(".category-group");
    if (groupItem) setGroupExpanded(groupItem, true);
    onSelect(link.dataset.categoryId ? { categoryId: link.dataset.categoryId } : { groupName: link.dataset.groupName ?? "" });
  });
}

// En celular la lista de categorías se pliega bajo el botón "Categorías".
export function setCategoriesOpen(toggle: HTMLElement, open: boolean): void {
  toggle.setAttribute("aria-expanded", String(open));
  toggle.closest(".catalog-sidebar")?.classList.toggle("categories-open", open);
}

export function attachCategoriesToggle(toggle: HTMLElement): void {
  toggle.addEventListener("click", () => setCategoriesOpen(toggle, toggle.getAttribute("aria-expanded") !== "true"));
}

// El botón "Categorías" solo se ve en celular.
export function isCategoriesToggleVisible(toggle: HTMLElement): boolean {
  return toggle.offsetParent !== null;
}
