const API_URL = process.env.API_URL ?? "http://localhost:3000";

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@hidrocenter.cl";

export async function api(method: string, path: string, body?: unknown) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();

  return { status: response.status, body: text ? JSON.parse(text) : null };
}

export function asUser(email: string) {
  return `?userId=${encodeURIComponent(email)}`;
}