import { API_ORIGIN } from "../config/api";
import { endSession, getSessionToken } from "./sessionService";

export const SESSION_EXPIRED_EVENT = "session-expired";

// Error que responde el backend. code permite reconocer un caso sin depender del texto
// (por ejemplo, EMAIL_NOT_VERIFIED cuando falta ingresar el código del correo).
export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

function readErrorBody(data: unknown): { message: string; code?: string } {
  if (!data || typeof data !== "object") return { message: "" };
  const body = data as Record<string, unknown>;
  return {
    message: typeof body.message === "string" ? body.message : "",
    code: typeof body.code === "string" ? body.code : undefined,
  };
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  errorMessage?: string;
}

// Envía la petición con el token de la sesión y convierte las respuestas de error en excepciones.
// T es el tipo de la respuesta: lo indica cada servicio (por ejemplo apiRequest<Product[]>).
export async function apiRequest<T>(path: string, { method = "GET", body, signal, errorMessage = "Error en la solicitud" }: ApiRequestOptions = {}): Promise<T> {
  const token = getSessionToken();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_ORIGIN}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  const data: unknown = response.status === 204 ? null : await response.json().catch(() => null);

  // Si el token expiró o ya no es válido, se cierra la sesión para que el usuario vuelva a entrar.
  if (response.status === 401 && token) {
    endSession();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }

  if (!response.ok) {
    const { message, code } = readErrorBody(data);
    throw new ApiError(message || errorMessage, response.status, code);
  }

  return data as T;
}
