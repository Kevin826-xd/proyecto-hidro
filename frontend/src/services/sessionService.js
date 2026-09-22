import { SESSION_KEY } from "../config/constants.js";

export function getCurrentUser() {
  const session = window.localStorage.getItem(SESSION_KEY);
  if (!session) return null;

  try {
    const parsed = JSON.parse(session);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
    return { email: parsed };
  } catch {
    return { email: session };
  }
}

export function isLoggedIn() {
  const currentUser = getCurrentUser();
  return Boolean(currentUser && currentUser.email);
}

export function startSession(userOrEmail) {
  const nextUser = typeof userOrEmail === "string"
    ? { email: userOrEmail }
    : {
        id: userOrEmail.id,
        name: userOrEmail.name,
        email: userOrEmail.email,
        role: userOrEmail.role || "customer",
      };

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
}

export function endSession() {
  window.localStorage.removeItem(SESSION_KEY);
}