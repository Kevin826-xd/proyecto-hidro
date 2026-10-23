import { SESSION_KEY } from "../config/constants.js";

function readSession() {
  try {
    const session = JSON.parse(window.localStorage.getItem(SESSION_KEY) ?? "null");
    return session && typeof session === "object" && session.token ? session : null;
  } catch {
    return null;
  }
}

// El rol guardado aquí solo sirve para mostrar u ocultar partes de la interfaz.
// Los permisos reales los valida el backend con el token.
export function getCurrentUser() {
  return readSession()?.user ?? null;
}

export function getSessionToken() {
  return readSession()?.token ?? "";
}

export function isLoggedIn() {
  return Boolean(readSession());
}

export function startSession(user, token) {
  const session = {
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

export function endSession() {
  window.localStorage.removeItem(SESSION_KEY);
}
