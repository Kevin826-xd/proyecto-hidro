import type { AppElements } from "../elements";
import { ApiError } from "../services/apiClient";
import { endSession, getCurrentUser, isLoggedIn, startSession } from "../services/sessionService";
import { EMAIL_NOT_VERIFIED, loginUser, registerUser, resendVerificationCode, verifyAccount } from "../services/userService";
import type { LoginResponse, SessionUser } from "../types/api";
import type { StatusType } from "../types/ui";
import { getErrorMessage } from "../utils/formatters";

export interface AuthCallbacks {
  onLogin: (user: SessionUser) => void | Promise<void>;
  onLogout: () => void;
}

type AuthForm = "login" | "register" | "verify";

const CODE_LENGTH = 6;

// Cuenta que espera el código del correo. La contraseña se guarda solo en memoria (nunca en localStorage)
// porque el backend la pide junto con el código; así la persona no tiene que volver a escribirla.
let pendingAccount: { email: string; password: string } | null = null;

function statusColor(type: StatusType): string {
  return type === "error" ? "var(--danger)" : type === "success" ? "var(--success)" : "var(--muted)";
}

export function setStatus(elements: AppElements, message: string, type: StatusType = "info"): void {
  elements.statusMessage.textContent = message;
  elements.statusMessage.style.color = statusColor(type);
}

// El mensaje se muestra en el formulario que está a la vista.
function activeAuthMessage(elements: AppElements): HTMLElement {
  if (!elements.registerForm.classList.contains("hidden")) return elements.registerAuthMessage;
  if (!elements.verifyForm.classList.contains("hidden")) return elements.verifyAuthMessage;
  return elements.loginAuthMessage;
}

export function setAuthMessage(elements: AppElements, message: string, type: StatusType = "info"): void {
  const activeMessage = activeAuthMessage(elements);
  activeMessage.textContent = message;
  activeMessage.style.color = statusColor(type);
}

function showAuthForm(elements: AppElements, form: AuthForm): void {
  elements.loginForm.classList.toggle("hidden", form !== "login");
  elements.registerForm.classList.toggle("hidden", form !== "register");
  elements.verifyForm.classList.toggle("hidden", form !== "verify");
}

// Muestra el formulario donde se ingresa el código que llegó al correo.
function showVerifyForm(elements: AppElements, account: { email: string; password: string }, message: string, type: StatusType): void {
  pendingAccount = account;
  elements.verifyForm.reset();
  elements.verifyEmailLabel.textContent = account.email;
  showAuthForm(elements, "verify");
  setAuthMessage(elements, message, type);
  elements.verifyCode.focus();
}

function backToLogin(elements: AppElements): void {
  pendingAccount = null;
  showAuthForm(elements, "login");
  setAuthMessage(elements, "");
}

// Catálogo, carrito y despacho son públicos; el login se muestra cuando el visitante quiere comprar o lo pide.
export function showCatalog(elements: AppElements): void {
  elements.authPanel.classList.add("hidden");
  elements.catalogWrapper.classList.remove("hidden");
  elements.cartPanel.classList.add("hidden");
  elements.shippingPanel.classList.add("hidden");
  elements.quotePanel.classList.add("hidden");
  elements.catalogLayout.classList.remove("hidden");
}

export function showAuthPanel(elements: AppElements, message = ""): void {
  elements.catalogWrapper.classList.add("hidden");
  elements.authPanel.classList.remove("hidden");
  // Si quedó una verificación a medias, se retoma en vez de volver al login.
  if (pendingAccount) {
    showAuthForm(elements, "verify");
  } else {
    showAuthForm(elements, "login");
  }
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

// Mientras se espera la respuesta se desactiva el botón para no enviar dos veces.
async function whileWaiting(button: HTMLButtonElement | null, action: () => Promise<void>): Promise<void> {
  if (button) button.disabled = true;
  try {
    await action();
  } finally {
    if (button) button.disabled = false;
  }
}

function submitButton(form: HTMLFormElement): HTMLButtonElement | null {
  return form.querySelector<HTMLButtonElement>("button[type=submit]");
}

export function attachAuthEvents(elements: AppElements, callbacks: AuthCallbacks): void {
  // Iniciar sesión y verificar la cuenta terminan igual: se guarda la sesión y se carga el carrito.
  function startUserSession(result: LoginResponse, message: string): void {
    startSession(result.user, result.token);
    pendingAccount = null;
    showAuthForm(elements, "login");
    setAuthMessage(elements, message, "success");
    // No se espera: si después falla cargar el carrito, la sesión igual quedó iniciada.
    void callbacks.onLogin(result.user);
  }

  elements.loginBtn.addEventListener("click", () => showAuthPanel(elements));
  elements.showRegisterBtn.addEventListener("click", () => {
    showAuthForm(elements, "register");
    setAuthMessage(elements, "");
  });
  elements.showLoginBtn.addEventListener("click", () => backToLogin(elements));
  elements.verifyBackBtn.addEventListener("click", () => backToLogin(elements));

  elements.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = elements.loginEmail.value.trim();
    const password = elements.loginPassword.value.trim();
    if (!email || !password) {
      setAuthMessage(elements, "Debes ingresar correo electrónico y contraseña.", "error");
      return;
    }

    await whileWaiting(submitButton(elements.loginForm), async () => {
      try {
        const result = await loginUser({ email, password });
        elements.loginForm.reset();
        startUserSession(result, "Sesión iniciada correctamente.");
      } catch (error) {
        // La contraseña era correcta pero falta verificar el correo: se pide el código.
        if (error instanceof ApiError && error.code === EMAIL_NOT_VERIFIED) {
          elements.loginForm.reset();
          showVerifyForm(elements, { email, password }, error.message, "info");
          return;
        }
        setAuthMessage(elements, getErrorMessage(error, "No se pudo iniciar sesión."), "error");
      }
    });
  });

  elements.registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = elements.registerName.value.trim();
    const email = elements.registerEmail.value.trim();
    const password = elements.registerPassword.value.trim();

    if (!name || !email || !password) {
      setAuthMessage(elements, "Completa nombre, correo electrónico y contraseña.", "error");
      return;
    }

    await whileWaiting(submitButton(elements.registerForm), async () => {
      try {
        const result = await registerUser({ name, email, password });
        elements.registerForm.reset();
        showVerifyForm(elements, { email: result.user.email, password }, result.message, result.codeSent ? "success" : "error");
      } catch (error) {
        setAuthMessage(elements, getErrorMessage(error, "No se pudo registrar el usuario."), "error");
      }
    });
  });

  // Solo se dejan los números: así también sirve pegar el código con espacios.
  elements.verifyCode.addEventListener("input", () => {
    elements.verifyCode.value = elements.verifyCode.value.replace(/\D/g, "").slice(0, CODE_LENGTH);
  });

  elements.verifyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const account = pendingAccount;
    if (!account) {
      backToLogin(elements);
      setAuthMessage(elements, "Inicia sesión para verificar tu cuenta.", "info");
      return;
    }

    const code = elements.verifyCode.value.trim();
    if (!new RegExp(`^\\d{${CODE_LENGTH}}$`).test(code)) {
      setAuthMessage(elements, `Ingresa los ${CODE_LENGTH} dígitos del código.`, "error");
      elements.verifyCode.focus();
      return;
    }

    await whileWaiting(submitButton(elements.verifyForm), async () => {
      try {
        const result = await verifyAccount({ ...account, code });
        elements.verifyForm.reset();
        startUserSession(result, result.message || "Tu cuenta quedó verificada.");
      } catch (error) {
        setAuthMessage(elements, getErrorMessage(error, "No se pudo verificar la cuenta."), "error");
        elements.verifyCode.select();
      }
    });
  });

  elements.resendCodeBtn.addEventListener("click", async () => {
    const account = pendingAccount;
    if (!account) return;

    await whileWaiting(elements.resendCodeBtn, async () => {
      try {
        const result = await resendVerificationCode(account.email);
        elements.verifyForm.reset();
        setAuthMessage(elements, result.message, "success");
      } catch (error) {
        setAuthMessage(elements, getErrorMessage(error, "No se pudo reenviar el código."), "error");
      }
    });
  });

  elements.logoutBtn.addEventListener("click", () => {
    endSession();
    callbacks.onLogout();
    setAuthMessage(elements, "Sesión cerrada.", "success");
  });
}
