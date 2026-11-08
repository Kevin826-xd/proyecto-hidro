import type { NewQuoteInput, Quote } from "../types/api";
import { apiRequest } from "./apiClient";

// No necesita sesión. Si hay una iniciada, apiRequest envía el token y el backend guarda quién la pidió.
export function createQuote(input: NewQuoteInput): Promise<Quote> {
  return apiRequest("/api/quotes", {
    method: "POST",
    body: input,
    errorMessage: "No se pudo enviar la cotización.",
  });
}

export function getAdminQuotes(): Promise<Quote[]> {
  return apiRequest("/api/quotes", { errorMessage: "No se pudieron cargar las cotizaciones." });
}
