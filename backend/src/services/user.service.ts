import { database } from "../db/connection";
import { ConflictError, TooManyRequestsError, ValidationError } from "../errors/http-errors";
import { hashPassword, isLegacyPasswordHash, verifyPassword } from "../utils/password";
import { CreateUserInput, User } from "../entities/user.entity";
import { CODE_RECENTLY_SENT_MESSAGE, RESEND_COOLDOWN_SECONDS } from "./verification.service";

const USER_COLUMNS = `id, name, email, password, role, status, created_at AS "createdAt"`;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

interface ExistingAccountRow {
  id: string;
  status: User["status"];
  codeRecentlySent: boolean;
}

function validateNewUser(input: CreateUserInput): CreateUserInput {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password.trim();

  if (!name || !email || !password) {
    throw new ValidationError("Nombre, email y contraseña son obligatorios");
  }

  if (!EMAIL_PATTERN.test(email)) {
    throw new ValidationError("Email inválido");
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
  }

  return { name, email, password };
}

// Crea una cuenta pendiente de verificar; el código se envía después (ver verification.service.ts).
// Si el email ya se registró pero nunca se verificó (por ejemplo, el código no llegó), se reemplazan
// el nombre y la contraseña en vez de rechazarlo: la cuenta no sirve hasta que se ingrese el código
// que llega a ese correo junto con la contraseña nueva.
export async function registerUser(input: CreateUserInput): Promise<User> {
  const { name, email, password } = validateNewUser(input);

  const existing = await database.query<ExistingAccountRow>(
    `SELECT id, status,
            COALESCE(verification_code_sent_at > NOW() - make_interval(secs => $2::int), FALSE) AS "codeRecentlySent"
     FROM users WHERE email = $1`,
    [email, RESEND_COOLDOWN_SECONDS],
  );
  const account = existing.rows[0];

  if (account?.status === "verified") {
    throw new ConflictError("Este email ya está registrado");
  }
  if (account?.codeRecentlySent) {
    throw new TooManyRequestsError(CODE_RECENTLY_SENT_MESSAGE);
  }

  const passwordHash = await hashPassword(password);
  const result = account
    ? await database.query<User>(
      `UPDATE users SET name = $2, password = $3
       WHERE id = $1 AND status = 'pending'
       RETURNING ${USER_COLUMNS}`,
      [account.id, name, passwordHash],
    )
    : await database.query<User>(
      `INSERT INTO users (id, name, email, password, status, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, 'pending', NOW())
       ON CONFLICT (email) DO NOTHING
       RETURNING ${USER_COLUMNS}`,
      [name, email, passwordHash],
    );

  // Otra petición registró o verificó el mismo email entre la consulta y el guardado.
  if (!result.rows[0]) {
    throw new ConflictError("Este email ya está registrado");
  }

  return result.rows[0];
}

export async function loginUser(email: string, password: string): Promise<User | null> {
  const user = await getUserByEmail(email);
  const normalizedPassword = password.trim();

  if (!user || !(await verifyPassword(normalizedPassword, user.password))) {
    return null;
  }

  if (isLegacyPasswordHash(user.password)) {
    await database.query("UPDATE users SET password = $1 WHERE id = $2", [await hashPassword(normalizedPassword), user.id]);
  }

  return user;
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await database.query<User>(
    `SELECT ${USER_COLUMNS}
     FROM users WHERE id = $1`,
    [id],
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
