import { database } from "../../../db/connection";
import { hashVerificationCode } from "../../../services/verification.service";

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

// Registra un cliente y deja su correo verificado directo en la base de datos, sin pasar por el código.
export async function createVerifiedCustomer(email: string): Promise<string> {
  await api("POST", "/api/users/register", { name: "Cliente Test", email, password: TEST_PASSWORD });
  await database.query(
    `UPDATE users SET status = 'verified', verification_code_hash = NULL, verification_code_expires_at = NULL,
       verification_code_sent_at = NULL, verification_attempts = 0
     WHERE email = $1`,
    [email],
  );
  return login(email, TEST_PASSWORD);
}

// El código real solo viaja por correo: las pruebas guardan uno conocido para la cuenta.
// Con expired: true el código queda vencido.
export async function setVerificationCode(email: string, code: string, { expired = false } = {}): Promise<void> {
  const result = await database.query<{ id: string }>("SELECT id FROM users WHERE email = $1", [email]);
  const userId = result.rows[0].id;
  await database.query(
    `UPDATE users
     SET verification_code_hash = $2, verification_code_expires_at = NOW() + $3::interval, verification_attempts = 0
     WHERE id = $1`,
    [userId, hashVerificationCode(userId, code), expired ? "-1 minute" : "15 minutes"],
  );
}
