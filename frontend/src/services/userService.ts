import type { LoginResponse, MessageResponse, RegisterResponse } from "../types/api";
import { apiRequest } from "./apiClient";

// Lo responde el backend al iniciar sesión con una cuenta que todavía no ingresa el código del correo.
export const EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED";

export function registerUser(payload: { name: string; email: string; password: string }): Promise<RegisterResponse> {
  return apiRequest("/api/users/register", { method: "POST", body: payload, errorMessage: "No se pudo registrar el usuario." });
}

export function loginUser(payload: { email: string; password: string }): Promise<LoginResponse> {
  return apiRequest("/api/users/login", { method: "POST", body: payload, errorMessage: "No se pudo iniciar sesión." });
}

// Con el código correcto la cuenta queda verificada y el backend devuelve la sesión, igual que al iniciar sesión.
export function verifyAccount(payload: { email: string; password: string; code: string }): Promise<LoginResponse> {
  return apiRequest("/api/users/verify", { method: "POST", body: payload, errorMessage: "No se pudo verificar la cuenta." });
}

export function resendVerificationCode(email: string): Promise<MessageResponse> {
  return apiRequest("/api/users/resend-code", { method: "POST", body: { email }, errorMessage: "No se pudo reenviar el código." });
}
