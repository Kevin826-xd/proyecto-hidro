import type { Category, Product } from "../types/api";
import { normalizeText } from "./formatters";

// Planilla CSV para la carga masiva de precios y stock.
// El administrador la descarga, cambia precio y stock en Excel y la vuelve a subir.
// Cada fila se reconoce por el id del producto; las columnas de categoría y nombre son solo de referencia.

// Excel en español (Chile) separa las columnas con punto y coma y usa coma decimal.
const DELIMITER = ";";
// Sin esta marca, Excel abre el archivo con otra codificación y los tildes se ven mal.
const UTF8_BOM = "﻿";
const HEADERS = ["id", "categoria", "producto", "precio", "stock"];

export interface PriceStockChange {
  product: Product;
  price: number;
  stock: number;
}

export interface PriceStockComparison {
  changes: PriceStockChange[];
  unchanged: number;
  errors: string[];
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[";\r\n,]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function categoryLabel(category: Category | undefined): string {
  if (!category) return "Sin categoría";
  return category.groupName ? `${category.groupName} / ${category.name}` : category.name;
}

export function buildPriceStockCsv(categories: Category[], products: Product[]): string {
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const rows = products
    .map((product) => ({ product, category: categoryLabel(categoriesById.get(product.categoryId)) }))
    .sort((a, b) => a.category.localeCompare(b.category, "es") || a.product.name.localeCompare(b.product.name, "es"))
    .map(({ product, category }) => [product.id, category, product.name, Number(product.price), Number(product.stock)]);

  return UTF8_BOM + [HEADERS, ...rows].map((row) => row.map(csvCell).join(DELIMITER)).join("\r\n") + "\r\n";
}

// Excel puede guardar con punto y coma, coma o tabulación según la configuración del equipo:
// se usa el separador que aparece en la fila de títulos.
function detectDelimiter(headerLine: string): string {
  const candidates = [";", ",", "\t"];
  return candidates.reduce((best, candidate) => (headerLine.split(candidate).length > headerLine.split(best).length ? candidate : best));
}

// Lee el CSV respetando las comillas (un nombre de producto puede tener punto y coma o saltos de línea).
export function parseCsv(text: string): string[][] {
  const content = text.replace(/^﻿/, "").replace(/^sep=.\r?\n/i, "");
  const delimiter = detectDelimiter(content.split(/\r?\n/, 1)[0] ?? "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    if (inQuotes) {
      if (char === '"' && content[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && content[index + 1] === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

// Lee un número escrito a la chilena o como lo guarda Excel: "4990", "4.990", "$ 4.990", "4990,5", "1.234,50".
// Un punto seguido de grupos de 3 dígitos se toma como separador de miles ("4.990" = 4990).
// Devuelve null si el texto no es un número.
export function parseSheetNumber(value: string): number | null {
  let text = value.trim().replace(/^\$/, "").replace(/\s/g, "");
  if (!text) return null;

  if (text.includes(",")) {
    text = text.replace(/\./g, "").replace(",", ".");
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(text)) {
    text = text.replace(/\./g, "");
  }
  if (!/^-?\d+(\.\d+)?$/.test(text)) return null;
  return Number(text);
}

function findColumn(headers: string[], names: string[]): number {
  return headers.findIndex((header) => names.includes(header));
}

// Compara la planilla con los productos actuales. Devuelve solo los productos que cambian,
// cuántos quedan igual y los errores de cada fila (con el número de fila que se ve en Excel).
export function comparePriceStockSheet(rows: string[][], products: Product[]): PriceStockComparison {
  const [headerRow = [], ...dataRows] = rows;
  const headers = headerRow.map(normalizeText);
  const idColumn = findColumn(headers, ["id"]);
  const priceColumn = findColumn(headers, ["precio", "price"]);
  const stockColumn = findColumn(headers, ["stock"]);

  const missingColumns = [
    idColumn < 0 ? "id" : "",
    priceColumn < 0 ? "precio" : "",
    stockColumn < 0 ? "stock" : "",
  ].filter(Boolean);
  if (missingColumns.length) {
    return {
      changes: [],
      unchanged: 0,
      errors: [`A la planilla le faltan las columnas: ${missingColumns.join(", ")}. Descarga la planilla y úsala como base.`],
    };
  }

  const productsById = new Map(products.map((product) => [product.id.toLowerCase(), product]));
  const seenIds = new Set<string>();
  const result: PriceStockComparison = { changes: [], unchanged: 0, errors: [] };

  dataRows.forEach((row, index) => {
    // La fila 1 de Excel son los títulos.
    const line = `Fila ${index + 2}`;
    if (row.every((cell) => !cell.trim())) return;

    const id = (row[idColumn] ?? "").trim().toLowerCase();
    const product = productsById.get(id);
    if (!product) {
      result.errors.push(`${line}: el producto no existe o se eliminó. Descarga la planilla de nuevo.`);
      return;
    }
    if (seenIds.has(id)) {
      result.errors.push(`${line}: "${product.name}" está repetido en la planilla.`);
      return;
    }
    seenIds.add(id);

    const price = parseSheetNumber(row[priceColumn] ?? "");
    const stock = parseSheetNumber(row[stockColumn] ?? "");
    if (price === null || price <= 0) {
      result.errors.push(`${line}: el precio de "${product.name}" debe ser un número mayor que cero.`);
      return;
    }
    if (stock === null || !Number.isInteger(stock) || stock < 0) {
      result.errors.push(`${line}: el stock de "${product.name}" debe ser un número entero, cero o mayor.`);
      return;
    }

    if (price === Number(product.price) && stock === Number(product.stock)) {
      result.unchanged += 1;
    } else {
      result.changes.push({ product, price, stock });
    }
  });

  return result;
}
