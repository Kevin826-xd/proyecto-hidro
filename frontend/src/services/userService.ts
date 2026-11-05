import { API_ORIGIN } from "../config/api";
import type { LoginResponse, RegisterResponse } from "../types/api";

const API_BASE = `${API_ORIGIN}/api/users`;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Error en la solicitud");
  }

  return data as T;
}

export async function registerUser(payload: { name: string; email: string; password: string }): Promise<RegisterResponse> {
  return request("/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: { email: string; password: string }): Promise<LoginResponse> {
  return request("/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
