import type { AppElements } from "../elements";
import { createCategory, createProduct } from "../services/adminService";
import type { Category, NewProductInput, Product } from "../types/api";
import type { StatusType } from "../types/ui";
import { escapeHtml, getErrorMessage } from "../utils/formatters";

// Formularios del panel de administración para crear categorías y productos nuevos.

export interface CatalogFormsCallbacks {
  onCategoryCreated: (category: Category) => void | Promise<void>;
  onProductCreated: (product: Product) => void | Promise<void>;
}

function setFormMessage(element: HTMLElement, message: string, type: StatusType = "info"): void {
  element.textContent = message;
  element.dataset.type = type;
}

// Texto del campo sin espacios extra; undefined si quedó vacío, para no enviar campos opcionales vacíos.
function optionalText(input: HTMLInputElement | HTMLTextAreaElement): string | undefined {
  return input.value.trim() || undefined;
}

// Llena el select de categorías del formulario de productos (agrupadas como en el catálogo)
// y la lista de grupos existentes que sugiere el campo "Grupo".
export function renderCategoryOptions(elements: AppElements, categories: Category[], selectedId = elements.newProductCategory.value): void {
  const standalone = categories.filter((category) => !category.groupName);
  const groups = new Map<string, Category[]>();
  categories.forEach((category) => {
    if (!category.groupName) return;
    groups.set(category.groupName, [...(groups.get(category.groupName) ?? []), category]);
  });

  const option = (category: Category) => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.name)}</option>`;
  elements.newProductCategory.innerHTML = [
    '<option value="">Selecciona una categoría</option>',
    ...standalone.map(option),
    ...[...groups].map(([groupName, items]) => `<optgroup label="${escapeHtml(groupName)}">${items.map(option).join("")}</optgroup>`),
  ].join("");
  // Si la categoría elegida ya no existe, el select vuelve a "Selecciona una categoría".
  elements.newProductCategory.value = categories.some((category) => category.id === selectedId) ? selectedId : "";

  elements.categoryGroupOptions.innerHTML = [...groups.keys()]
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((groupName) => `<option value="${escapeHtml(groupName)}"></option>`)
    .join("");
}

// Revisa el formulario de productos. Devuelve los datos a enviar o un mensaje con lo que falta.
function readProductForm(elements: AppElements): NewProductInput | string {
  const name = elements.newProductName.value.trim();
  const categoryId = elements.newProductCategory.value;
  const price = Number(elements.newProductPrice.value);
  const stock = Number(elements.newProductStock.value);

  if (!name) return "Escribe el nombre del producto.";
  if (!categoryId) return "Elige la categoría del producto.";
  if (!elements.newProductPrice.value || !Number.isFinite(price) || price <= 0) return "El precio debe ser mayor que cero.";
  if (!elements.newProductStock.value || !Number.isInteger(stock) || stock < 0) return "El stock debe ser un número entero, cero o mayor.";

  return {
    name,
    categoryId,
    price,
    stock,
    description: optionalText(elements.newProductDescription),
    material: optionalText(elements.newProductMaterial),
    diameter: optionalText(elements.newProductDiameter),
    workingPressure: optionalText(elements.newProductPressure),
    imageUrl: optionalText(elements.newProductImage),
  };
}

// Mientras se guarda se desactiva el botón para no crear el mismo elemento dos veces.
async function whileSaving(form: HTMLFormElement, action: () => Promise<void>): Promise<void> {
  const button = form.querySelector<HTMLButtonElement>("button[type=submit]");
  if (button) button.disabled = true;
  try {
    await action();
  } finally {
    if (button) button.disabled = false;
  }
}

export function attachCatalogForms(elements: AppElements, callbacks: CatalogFormsCallbacks): void {
  // Al volver a escribir se borra el aviso anterior, para que no quede un error que ya se corrigió.
  elements.newCategoryForm.addEventListener("input", () => setFormMessage(elements.newCategoryMessage, ""));
  elements.newProductForm.addEventListener("input", () => setFormMessage(elements.newProductMessage, ""));

  elements.newCategoryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = elements.newCategoryName.value.trim();
    const groupName = optionalText(elements.newCategoryGroup);
    if (!name) {
      setFormMessage(elements.newCategoryMessage, "Escribe el nombre de la categoría.", "error");
      elements.newCategoryName.focus();
      return;
    }

    void whileSaving(elements.newCategoryForm, async () => {
      try {
        const category = await createCategory({ name, groupName, description: optionalText(elements.newCategoryDescription) });
        elements.newCategoryForm.reset();
        setFormMessage(
          elements.newCategoryMessage,
          groupName ? `Categoría "${category.name}" creada en el grupo "${groupName}".` : `Categoría "${category.name}" creada.`,
          "success",
        );
        await callbacks.onCategoryCreated(category);
      } catch (error) {
        setFormMessage(elements.newCategoryMessage, getErrorMessage(error, "No se pudo crear la categoría."), "error");
      }
    });
  });

  elements.newProductForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = readProductForm(elements);
    if (typeof input === "string") {
      setFormMessage(elements.newProductMessage, input, "error");
      return;
    }

    void whileSaving(elements.newProductForm, async () => {
      try {
        const product = await createProduct(input);
        // Se mantiene la categoría elegida para poder agregar varios productos seguidos a la misma.
        const categoryId = elements.newProductCategory.value;
        elements.newProductForm.reset();
        elements.newProductCategory.value = categoryId;
        setFormMessage(elements.newProductMessage, `Producto "${product.name}" creado. Ya aparece en el catálogo.`, "success");
        await callbacks.onProductCreated(product);
      } catch (error) {
        setFormMessage(elements.newProductMessage, getErrorMessage(error, "No se pudo crear el producto."), "error");
      }
    });
  });
}
