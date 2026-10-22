import crypto from "node:crypto";
import { database } from "../utils/database";
import { ApprovalDecision, CreateUserInput, User } from "../entities/user.entity";

const USER_COLUMNS = `id, name, email, password, role, status, created_at AS "createdAt"`;

export interface CreatedUser {
  user: User;
  approvalToken: string;
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// En la base de datos solo se guarda el hash del token, así nadie puede usar los enlaces leyendo la tabla.
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createUser(input: CreateUserInput): Promise<CreatedUser> {
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

  const approvalToken = crypto.randomBytes(32).toString("hex");
  const result = await database.query<User>(
    `INSERT INTO users (id, name, email, password, status, approval_token_hash, created_at)
      VALUES (gen_random_uuid(), $1, $2, $3, 'pending', $4, NOW())
      RETURNING ${USER_COLUMNS}`,
    [name, email, hashPassword(password), hashToken(approvalToken)],
  );

  return { user: result.rows[0], approvalToken };
}

export async function loginUser(email: string, password: string): Promise<User | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = hashPassword(password.trim());

  const result = await database.query<User>(
    `SELECT ${USER_COLUMNS}
     FROM users
     WHERE email = $1 AND password = $2`,
    [normalizedEmail, passwordHash],
  );

  return result.rows[0] ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await database.query<User>(
    `SELECT ${USER_COLUMNS}
     FROM users WHERE email = $1`,
    [email.trim().toLowerCase()],
  );

  return result.rows[0] ?? null;
}

export async function getPendingUserByToken(token: string): Promise<User | null> {
  const result = await database.query<User>(
    `SELECT ${USER_COLUMNS}
     FROM users WHERE approval_token_hash = $1 AND status = 'pending'`,
    [hashToken(token)],
  );

  return result.rows[0] ?? null;
}

// Aprueba o rechaza la solicitud. El token se borra para que el enlace sirva una sola vez.
export async function decideUserApproval(token: string, decision: ApprovalDecision): Promise<User | null> {
  const result = await database.query<User>(
    `UPDATE users
     SET status = $2, approval_token_hash = NULL
     WHERE approval_token_hash = $1 AND status = 'pending'
     RETURNING ${USER_COLUMNS}`,
    [hashToken(token), decision === "approve" ? "approved" : "rejected"],
  );

  return result.rows[0] ?? null;
}
