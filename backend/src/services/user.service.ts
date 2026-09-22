import crypto from "node:crypto";
import { database } from "../utils/database";
import { CreateUserInput, User } from "../entities/user.entity";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password.trim();

  if (!name || !email || !password) {
    throw new Error("Nombre, email y contraseña son obligatorios");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Email inválido");
  }

  if (password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres");
  }

  const existing = await database.query<{ id: string }>(
    "SELECT id FROM users WHERE email = $1",
    [email],
  );

  if ((existing.rowCount ?? 0) > 0) {
    throw new Error("Este email ya está registrado");
  }

  const result = await database.query<User>(
    `INSERT INTO users (id, name, email, password, created_at)
      VALUES (gen_random_uuid(), $1, $2, $3, NOW())
      RETURNING id, name, email, password, role, created_at AS "createdAt"`,
    [name, email, hashPassword(password)],
  );

  return result.rows[0];
}

export async function loginUser(email: string, password: string): Promise<User | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = hashPassword(password.trim());

  const result = await database.query<User>(
    `SELECT id, name, email, password, role, created_at AS "createdAt"
     FROM users
     WHERE email = $1 AND password = $2`,
    [normalizedEmail, passwordHash],
  );

  return result.rows[0] ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await database.query<User>(
    `SELECT id, name, email, password, role, created_at AS "createdAt"
     FROM users WHERE email = $1`,
    [email.trim().toLowerCase()],
  );

  return result.rows[0] ?? null;
}
