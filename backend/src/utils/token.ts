import jwt from "jsonwebtoken";
import { User } from "../entities/user.entity";

const TOKEN_EXPIRATION = "8h";

export interface TokenPayload {
  sub: string;
  email: string;
  role: User["role"];
}

// Se llama al iniciar el servidor para que falle de inmediato si falta la clave.
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error("Falta JWT_SECRET en el archivo .env");
  }
  return secret;
}

export function signAccessToken(user: Pick<User, "id" | "email" | "role">): string {
  return jwt.sign({ email: user.email, role: user.role }, getJwtSecret(), {
    subject: user.id,
    expiresIn: TOKEN_EXPIRATION,
  });
}

// Devuelve null si el token no es válido, fue modificado o ya expiró.
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (typeof payload === "string" || !payload.sub) return null;
    return { sub: payload.sub, email: String(payload.email), role: payload.role };
  } catch {
    return null;
  }
}
