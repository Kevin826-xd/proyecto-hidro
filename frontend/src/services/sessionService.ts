import { SESSION_KEY } from "../config/constants";
import type { SessionUser } from "../types/api";

interface Session {
  token: string;
  user: SessionUser;
}

function readSession(): Session | null {
  try {
    const session: unknown = JSON.parse(window.localStorage.getItem(SESSION_KEY) ?? "null");
    return session && typeof session === "object" && "token" in session && session.token ? (session as Session) : null;
  } catch {
    return null;
  }
}

// El rol guardado aquí solo sirve para mostrar u ocultar partes de la interfaz.
// Los permisos reales los valida el backend con el token.
export function getCurrentUser(): SessionUser | null {
  return readSession()?.user ?? null;
}

export function getSessionToken(): string {
  return readSession()?.token ?? "";
}

export function isLoggedIn(): boolean {
  return Boolean(readSession());
}

export function startSession(user: SessionUser, token: string): void {
  const session: Session = {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "customer",
    },
  };

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function endSession(): void {
  window.localStorage.removeItem(SESSION_KEY);
}
