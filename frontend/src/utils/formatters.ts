export const formatPrice = (value: number | string | null | undefined): string =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

export const formatDistance = (km: number | null | undefined): string =>
  `${Number(km ?? 0).toLocaleString("es-CL", { maximumFractionDigits: 1 })} km`;

// Fecha en formato AAAA-MM-DD según la hora local (no UTC).
export function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayForCalendar(): string {
  return getDateKey(new Date());
}

export function formatDate(dateValue: string): string {
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("es-CL", { dateStyle: "long" });
}

// Sin mayúsculas ni tildes, para que "cañeria" encuentre "Cañería".
export function normalizeText(text: unknown): string {
  return String(text ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// Evita que un texto (por ejemplo, el nombre de un producto) se interprete como HTML.
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Mensaje de un error capturado en un catch, que en TypeScript puede ser cualquier cosa.
export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

// Las peticiones canceladas con AbortController lanzan un error "AbortError" que no se muestra al usuario.
export function isAbortError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}
