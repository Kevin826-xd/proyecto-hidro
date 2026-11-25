import type { AppElements } from "../elements";
import { getAdminProducts, updatePriceStockBulk } from "../services/adminService";
import { getCategories } from "../services/categoriesService";
import type { StatusType } from "../types/ui";
import { escapeHtml, formatPrice, getErrorMessage } from "../utils/formatters";
import { buildPriceStockCsv, comparePriceStockSheet, parseCsv, type PriceStockChange } from "../utils/priceStockSheet";

// Carga masiva de precios y stock en el panel de administración:
// 1. "Descargar planilla" genera un CSV con los productos actuales.
// 2. "Subir planilla" lo lee y muestra qué cambia, sin guardar nada todavía.
// 3. "Aplicar cambios" guarda todo junto; si algo falla no se guarda ningún cambio.

// Más errores que estos no caben en pantalla: se muestra cuántos faltan.
const MAX_ERRORS_SHOWN = 15;

// Un precio que baja a menos de la mitad o sube a más del doble suele ser un error de tipeo (por ejemplo, 4,99 en vez de 4.990).
function isLargePriceChange(change: PriceStockChange): boolean {
  const ratio = change.price / Number(change.product.price);
  return ratio < 0.5 || ratio > 2;
}

function valueChangeMarkup(before: string, after: string): string {
  return before === after
    ? `<span class="admin-bulk-same">${after}</span>`
    : `<span class="admin-bulk-before">${before}</span> → <strong>${after}</strong>`;
}

function changeRowMarkup(change: PriceStockChange): string {
  const warning = isLargePriceChange(change)
    ? '<span class="admin-bulk-warning">Revisa este precio: cambia mucho</span>'
    : "";
  return `<tr${warning ? ' class="admin-bulk-row-warning"' : ""}>
    <td>${escapeHtml(change.product.name)}${warning}</td>
    <td>${valueChangeMarkup(formatPrice(Number(change.product.price)), formatPrice(change.price))}</td>
    <td>${valueChangeMarkup(String(change.product.stock), String(change.stock))}</td>
  </tr>`;
}

function errorsMarkup(errors: string[]): string {
  const hidden = errors.length - MAX_ERRORS_SHOWN;
  return `<div class="admin-bulk-errors" role="alert">
    <strong>No se guardó ningún cambio. Corrige estas filas en la planilla y vuelve a subirla:</strong>
    <ul>${errors.slice(0, MAX_ERRORS_SHOWN).map((error) => `<li>${escapeHtml(error)}</li>`).join("")}</ul>
    ${hidden > 0 ? `<p>Y ${hidden} ${hidden === 1 ? "error" : "errores"} más.</p>` : ""}
  </div>`;
}

function previewMarkup(changes: PriceStockChange[], unchanged: number): string {
  const warnings = changes.filter(isLargePriceChange).length;
  return `<div class="admin-bulk-preview">
    <p><strong>${changes.length} ${changes.length === 1 ? "producto cambia" : "productos cambian"}</strong>
      · ${unchanged} sin cambios. Revisa la lista y presiona "Aplicar cambios" para guardarlos.</p>
    ${warnings ? `<p class="admin-bulk-warning">${warnings === 1 ? "Hay 1 precio" : `Hay ${warnings} precios`} que cambian mucho: revísalos antes de aplicar.</p>` : ""}
    <div class="admin-table-wrapper"><table class="admin-table">
      <thead><tr><th>Producto</th><th>Precio</th><th>Stock</th></tr></thead>
      <tbody>${changes.map(changeRowMarkup).join("")}</tbody>
    </table></div>
    <div class="admin-bulk-buttons">
      <button class="button admin-bulk-apply" type="button">Aplicar cambios</button>
      <button class="button button-secondary admin-bulk-cancel" type="button">Cancelar</button>
    </div>
  </div>`;
}

function downloadFile(fileName: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function todayStamp(): string {
  const today = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
}

// onApplied recarga la tabla de precios y el catálogo después de guardar.
export function attachPriceStockBulk(elements: AppElements, onApplied: () => unknown): void {
  let pendingChanges: PriceStockChange[] = [];

  function setMessage(message: string, type: StatusType = "info"): void {
    elements.priceStockMessage.textContent = message;
    elements.priceStockMessage.dataset.type = type;
  }

  function clearPreview(): void {
    pendingChanges = [];
    elements.priceStockPreview.innerHTML = "";
  }

  elements.downloadPriceStockBtn.addEventListener("click", async () => {
    elements.downloadPriceStockBtn.disabled = true;
    try {
      const [categories, products] = await Promise.all([getCategories(), getAdminProducts()]);
      downloadFile(`precios-stock-${todayStamp()}.csv`, buildPriceStockCsv(categories, products));
      setMessage("Planilla descargada. Cambia solo las columnas precio y stock, guárdala como CSV y súbela.");
    } catch (error) {
      setMessage(getErrorMessage(error, "No se pudo descargar la planilla."), "error");
    } finally {
      elements.downloadPriceStockBtn.disabled = false;
    }
  });

  elements.priceStockFile.addEventListener("change", async () => {
    const file = elements.priceStockFile.files?.[0];
    // Se limpia para que se pueda volver a subir el mismo archivo después de corregirlo.
    elements.priceStockFile.value = "";
    if (!file) return;

    clearPreview();
    if (!/\.csv$/i.test(file.name)) {
      setMessage("La planilla debe ser un archivo .csv. En Excel usa \"Guardar como\" → \"CSV UTF-8\".", "error");
      return;
    }

    setMessage("Revisando la planilla...");
    try {
      // Se compara con los valores actuales de la base de datos, no con los que había al abrir el panel.
      const [text, products] = await Promise.all([file.text(), getAdminProducts()]);
      const { changes, unchanged, errors } = comparePriceStockSheet(parseCsv(text), products);

      if (errors.length) {
        setMessage("");
        elements.priceStockPreview.innerHTML = errorsMarkup(errors);
        return;
      }
      if (!changes.length) {
        setMessage(unchanged
          ? `La planilla no tiene cambios: los ${unchanged} productos ya tienen ese precio y stock.`
          : "La planilla no tiene productos.");
        return;
      }

      pendingChanges = changes;
      setMessage("");
      elements.priceStockPreview.innerHTML = previewMarkup(changes, unchanged);
    } catch (error) {
      setMessage(getErrorMessage(error, "No se pudo leer la planilla."), "error");
    }
  });

  elements.priceStockPreview.addEventListener("click", async (event) => {
    if (!(event.target instanceof Element)) return;

    if (event.target.closest(".admin-bulk-cancel")) {
      clearPreview();
      setMessage("Carga cancelada. No se guardó ningún cambio.");
      return;
    }

    const applyButton = event.target.closest<HTMLButtonElement>(".admin-bulk-apply");
    if (!applyButton || !pendingChanges.length) return;

    applyButton.disabled = true;
    setMessage("Guardando cambios...");
    try {
      const { updated } = await updatePriceStockBulk(
        pendingChanges.map(({ product, price, stock }) => ({ id: product.id, price, stock })),
      );
      clearPreview();
      setMessage(`Listo: se ${updated === 1 ? "actualizó 1 producto" : `actualizaron ${updated} productos`}.`, "success");
      await onApplied();
    } catch (error) {
      applyButton.disabled = false;
      setMessage(getErrorMessage(error, "No se pudieron guardar los cambios. No se modificó ningún producto."), "error");
    }
  });
}
