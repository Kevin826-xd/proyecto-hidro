import { API_ORIGIN } from "../config/api.js";
import { endSession, getSessionToken } from "./sessionService.js";

export const SESSION_EXPIRED_EVENT = "session-expired";

// Envía la petición con el token de la sesión y convierte las respuestas de error en excepciones.
export async function apiRequest(path, { method = "GET", body, signal, errorMessage = "Error en la solicitud" } = {}) {
  const token = getSessionToken();
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_ORIGIN}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  const data = response.status === 204 ? null : await response.json().catch(() => null);

  // Si el token expiró o ya no es válido, se cierra la sesión para que el usuario vuelva a entrar.
  if (response.status === 401 && token) {
    endSession();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }

  if (!response.ok) {
    throw new Error(data?.message || errorMessage);
  }

  return data;
}
