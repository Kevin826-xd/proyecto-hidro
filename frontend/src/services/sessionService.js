import { SESSION_KEY } from "../config/constants.js";

export function getCurrentUser() {
  const session = window.localStorage.getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
}

export function isLoggedIn() {
  return Boolean(window.localStorage.getItem(SESSION_KEY));
}

export function startSession(email) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ email }));
}

export function endSession() {
  window.localStorage.removeItem(SESSION_KEY);
}