import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 10;
const LEGACY_SHA256_PATTERN = /^[a-f0-9]{64}$/;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

// Antes las contraseñas se guardaban con SHA-256. Esas cuentas siguen funcionando
// y se actualizan a bcrypt la próxima vez que el usuario inicia sesión.
export function isLegacyPasswordHash(storedHash: string): boolean {
  return LEGACY_SHA256_PATTERN.test(storedHash);
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (isLegacyPasswordHash(storedHash)) {
    const legacyHash = crypto.createHash("sha256").update(password).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(legacyHash), Buffer.from(storedHash));
  }

  return bcrypt.compare(password, storedHash);
}
