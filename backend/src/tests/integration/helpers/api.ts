import { database } from "../../../db/connection";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@hidrocenter.cl";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin123!";
export const TEST_PASSWORD = "secreto123";

export async function api(method: string, path: string, body?: unknown, token?: string) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();

  return { status: response.status, body: text ? JSON.parse(text) : null };
}

export async function login(email: string, password: string): Promise<string> {
  const result = await api("POST", "/api/users/login", { email, password });
  if (!result.body?.token) {
    throw new Error(`No se pudo iniciar sesión como ${email}: ${result.body?.message}`);
  }
  return result.body.token;
}

export function loginAsAdmin(): Promise<string> {
  return login(ADMIN_EMAIL, ADMIN_PASSWORD);
}

// Registra un cliente y lo aprueba directo en la base de datos, sin pasar por el correo.
export async function createApprovedCustomer(email: string): Promise<string> {
  await api("POST", "/api/users/register", { name: "Cliente Test", email, password: TEST_PASSWORD });
  await database.query("UPDATE users SET status = 'approved', approval_token_hash = NULL WHERE email = $1", [email]);
  return login(email, TEST_PASSWORD);
}
