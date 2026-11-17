import crypto from "node:crypto";
import { database } from "../db/connection";
import { ServiceUnavailableError, TooManyRequestsError, ValidationError } from "../errors/http-errors";
import { verificationCodeEmail } from "../templates/verification.template";
import { verifyPassword } from "../utils/password";
import { getJwtSecret } from "../utils/token";
import { sendMail } from "./mail.service";

// Verificación del correo: al registrarse, la persona recibe un código de 6 dígitos en su email
// y lo ingresa en la tienda para activar su cuenta.

export const VERIFICATION_CODE_LENGTH = 6;
export const VERIFICATION_CODE_TTL_MINUTES = 15;
// Intentos fallidos por código. Con 6 dígitos hay un millón de combinaciones: sin este límite se podrían probar todas.
export const MAX_VERIFICATION_ATTEMPTS = 5;
// Tiempo mínimo entre dos correos con código para la misma cuenta.
export const RESEND_COOLDOWN_SECONDS = 60;

export const CODE_RECENTLY_SENT_MESSAGE =
  "Ya te enviamos un código hace menos de un minuto. Revisa tu correo o espera un momento para pedir otro.";
const INVALID_CODE_MESSAGE = "El código no es válido o ya fue usado. Pide un código nuevo.";
const CODE_PATTERN = new RegExp(`^\\d{${VERIFICATION_CODE_LENGTH}}$`);

interface PendingAccountRow {
  id: string;
  password: string;
  codeHash: string | null;
  expired: boolean;
}

export interface VerificationRecipient {
  id: string;
  name: string;
  email: string;
}

// Número al azar de 6 dígitos, con ceros a la izquierda si corresponde (por ejemplo "004271").
export function generateVerificationCode(): string {
  return crypto.randomInt(0, 10 ** VERIFICATION_CODE_LENGTH).toString().padStart(VERIFICATION_CODE_LENGTH, "0");
}

// En la base de datos solo se guarda el hash. Se usa HMAC con la clave del servidor (y el id de la cuenta)
// porque un hash simple de 6 dígitos se adivina en segundos teniendo acceso a la tabla.
export function hashVerificationCode(userId: string, code: string): string {
  return crypto.createHmac("sha256", getJwtSecret()).update(`${userId}:${code}`).digest("hex");
}

function sameHash(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "hex");
  const bufferB = Buffer.from(b, "hex");
  return bufferA.length === bufferB.length && crypto.timingSafeEqual(bufferA, bufferB);
}

export function attemptsLeftMessage(remaining: number): string {
  if (remaining <= 0) return "El código es incorrecto y ya no te quedan intentos. Pide un código nuevo.";
  return `El código es incorrecto. Te ${remaining === 1 ? "queda 1 intento" : `quedan ${remaining} intentos`}.`;
}

// Genera un código nuevo (el anterior deja de servir), lo guarda y lo envía al correo de la cuenta.
// Si se pidió otro hace menos de un minuto responde 429, así nadie puede llenar de correos a otra persona.
export async function sendVerificationCode(recipient: VerificationRecipient): Promise<void> {
  const code = generateVerificationCode();
  const issued = await database.query(
    `UPDATE users
     SET verification_code_hash = $2,
         verification_code_expires_at = NOW() + make_interval(mins => $3::int),
         verification_code_sent_at = NOW(),
         verification_attempts = 0
     WHERE id = $1 AND status = 'pending'
       AND (verification_code_sent_at IS NULL OR verification_code_sent_at <= NOW() - make_interval(secs => $4::int))`,
    [recipient.id, hashVerificationCode(recipient.id, code), VERIFICATION_CODE_TTL_MINUTES, RESEND_COOLDOWN_SECONDS],
  );

  if (!issued.rowCount) {
    throw new TooManyRequestsError(CODE_RECENTLY_SENT_MESSAGE);
  }

  try {
    await sendMail({
      to: recipient.email,
      subject: "Tu código para verificar tu cuenta",
      text: [
        `Hola ${recipient.name},`,
        "",
        `Tu código para verificar tu cuenta es: ${code}`,
        `Vence en ${VERIFICATION_CODE_TTL_MINUTES} minutos.`,
        "",
        "Si no creaste una cuenta, ignora este correo.",
      ].join("\n"),
      html: verificationCodeEmail(recipient.name, code, VERIFICATION_CODE_TTL_MINUTES),
    });
  } catch (error) {
    console.error("No se pudo enviar el correo con el código de verificación", error);
    // El correo no salió: se quita la espera para que la persona pueda pedir otro código de inmediato.
    await database.query("UPDATE users SET verification_code_sent_at = NULL WHERE id = $1", [recipient.id]);
    throw new ServiceUnavailableError("No pudimos enviar el correo con el código. Intenta nuevamente en unos minutos.");
  }
}

// Envía un código nuevo si la cuenta existe y está pendiente. Si no, no hace nada:
// la respuesta es la misma para no revelar qué correos están registrados.
export async function resendVerificationCode(email: string): Promise<void> {
  const result = await database.query<VerificationRecipient>(
    "SELECT id, name, email FROM users WHERE email = $1 AND status = 'pending'",
    [email.trim().toLowerCase()],
  );

  if (result.rows[0]) {
    await sendVerificationCode(result.rows[0]);
  }
}

// Revisa el código y, si es correcto, deja la cuenta verificada. Devuelve el id de la cuenta.
// También se pide la contraseña: así, si alguien registró el correo de otra persona con una contraseña suya,
// el dueño del correo no termina activando una cuenta que el otro puede usar.
export async function verifyEmailCode(email: string, password: string, code: string): Promise<string> {
  const cleanCode = code.trim();
  if (!CODE_PATTERN.test(cleanCode)) {
    throw new ValidationError(`El código debe tener ${VERIFICATION_CODE_LENGTH} dígitos`);
  }

  const result = await database.query<PendingAccountRow>(
    `SELECT id, password, verification_code_hash AS "codeHash",
            verification_code_expires_at <= NOW() AS expired
     FROM users WHERE email = $1 AND status = 'pending'`,
    [email.trim().toLowerCase()],
  );
  const account = result.rows[0];

  if (!account?.codeHash) {
    throw new ValidationError(INVALID_CODE_MESSAGE);
  }
  if (account.expired) {
    throw new ValidationError("El código expiró. Pide un código nuevo.");
  }

  // El intento se cuenta antes de comparar: así ni con peticiones en paralelo se pasa del máximo.
  const attempt = await database.query<{ attempts: number }>(
    `UPDATE users SET verification_attempts = verification_attempts + 1
     WHERE id = $1 AND verification_attempts < $2
     RETURNING verification_attempts AS attempts`,
    [account.id, MAX_VERIFICATION_ATTEMPTS],
  );
  if (!attempt.rows[0]) {
    throw new TooManyRequestsError("Superaste el máximo de intentos para este código. Pide un código nuevo.");
  }

  const codeMatches = sameHash(hashVerificationCode(account.id, cleanCode), account.codeHash);
  const passwordMatches = await verifyPassword(password.trim(), account.password);
  if (!codeMatches || !passwordMatches) {
    throw new ValidationError(attemptsLeftMessage(MAX_VERIFICATION_ATTEMPTS - attempt.rows[0].attempts));
  }

  // El código se borra para que no se pueda volver a usar.
  await database.query(
    `UPDATE users
     SET status = 'verified', verification_code_hash = NULL, verification_code_expires_at = NULL,
         verification_code_sent_at = NULL, verification_attempts = 0
     WHERE id = $1`,
    [account.id],
  );

  return account.id;
}
