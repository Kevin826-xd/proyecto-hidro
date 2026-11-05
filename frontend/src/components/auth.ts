import type { AppElements } from "../elements";
import { endSession, getCurrentUser, isLoggedIn, startSession } from "../services/sessionService";
import { loginUser, registerUser } from "../services/userService";
import type { SessionUser } from "../types/api";
import type { StatusType } from "../types/ui";
import { getErrorMessage } from "../utils/formatters";

export interface AuthCallbacks {
  onLogin: (user: SessionUser) => void | Promise<void>;
  onLogout: () => void;
}

function statusColor(type: StatusType): string {
  return type === "error" ? "var(--danger)" : type === "success" ? "var(--success)" : "var(--muted)";
}

export function setStatus(elements: AppElements, message: string, type: StatusType = "info"): void {
  elements.statusMessage.textContent = message;
  elements.statusMessage.style.color = statusColor(type);
}

export function setAuthMessage(elements: AppElements, message: string, type: StatusType = "info"): void {
  const activeMessage = elements.registerForm.classList.contains("hidden")
    ? elements.loginAuthMessage
    : elements.registerAuthMessage;

  activeMessage.textContent = message;
  activeMessage.style.color = statusColor(type);
}

function toggleAuthForms(elements: AppElements, showRegister: boolean): void {
  elements.loginForm.classList.toggle("hidden", showRegister);
  elements.registerForm.classList.toggle("hidden", !showRegister);
}

// Catálogo, carrito y despacho son públicos; el login se muestra cuando el visitante quiere comprar o lo pide.
export function showCatalog(elements: AppElements): void {
  elements.authPanel.classList.add("hidden");
  elements.catalogWrapper.classList.remove("hidden");
  elements.cartPanel.classList.add("hidden");
  elements.shippingPanel.classList.add("hidden");
  elements.catalogLayout.classList.remove("hidden");
}

export function showAuthPanel(elements: AppElements, message = ""): void {
  elements.catalogWrapper.classList.add("hidden");
  elements.authPanel.classList.remove("hidden");
  toggleAuthForms(elements, false);
  setAuthMessage(elements, message);
}

export function renderAuthState(elements: AppElements, onLoggedIn: () => void): void {
  const user = getCurrentUser();
  const loggedIn = isLoggedIn();
  showCatalog(elements);
  elements.loginBtn.classList.toggle("hidden", loggedIn);
  elements.logoutBtn.classList.toggle("hidden", !loggedIn);

  if (loggedIn && user) {
    setStatus(elements, `Sesión activa para ${user.email}`, "success");
    onLoggedIn();
    return;
  }
  setAuthMessage(elements, "");
}

export function attachAuthEvents(elements: AppElements, callbacks: AuthCallbacks): void {
  elements.loginBtn.addEventListener("click", () => showAuthPanel(elements));
  elements.showRegisterBtn.addEventListener("click", () => toggleAuthForms(elements, true));
  elements.showLoginBtn.addEventListener("click", () => toggleAuthForms(elements, false));

  elements.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = elements.loginEmail.value.trim();
    const password = elements.loginPassword.value.trim();
    if (!email || !password) {
      setAuthMessage(elements, "Debes ingresar email y contraseña.", "error");
      return;
    }

    try {
      const result = await loginUser({ email, password });
      startSession(result.user, result.token);
      setAuthMessage(elements, "Sesión iniciada correctamente.", "success");
      elements.loginForm.reset();
      // No se espera: si después falla cargar el carrito, la sesión igual quedó iniciada.
      void callbacks.onLogin(result.user);
    } catch (error) {
      setAuthMessage(elements, getErrorMessage(error, "No se pudo iniciar sesión."), "error");
    }
  });

  elements.registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = elements.registerName.value.trim();
    const email = elements.registerEmail.value.trim();
    const password = elements.registerPassword.value.trim();

    if (!name || !email || !password) {
      setAuthMessage(elements, "Completa nombre, email y contraseña.", "error");
      return;
    }

    try {
      const result = await registerUser({ name, email, password });
      elements.registerForm.reset();
      toggleAuthForms(elements, false);
      setAuthMessage(elements, result.message || "Registro recibido. Tu cuenta debe ser aprobada por un administrador.", "success");
    } catch (error) {
      setAuthMessage(elements, getErrorMessage(error, "No se pudo registrar el usuario."), "error");
    }
  });

  elements.logoutBtn.addEventListener("click", () => {
    endSession();
    callbacks.onLogout();
    setAuthMessage(elements, "Sesión cerrada.", "success");
  });
}
