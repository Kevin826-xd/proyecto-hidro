import { endSession, getCurrentUser, isLoggedIn, startSession } from "../services/sessionService.js";
import { loginUser, registerUser } from "../services/userService.js";

export function setStatus(elements, message, type = "info") {
  elements.statusMessage.textContent = message;
  elements.statusMessage.style.color = type === "error" ? "var(--danger)" : type === "success" ? "var(--success)" : "var(--muted)";
}

export function setAuthMessage(elements, message, type = "info") {
  const activeMessage = elements.registerForm && !elements.registerForm.classList.contains("hidden")
    ? elements.registerAuthMessage
    : elements.loginAuthMessage;

  if (!activeMessage) {
    return;
  }

  activeMessage.textContent = message;
  activeMessage.style.color = type === "error" ? "var(--danger)" : type === "success" ? "var(--success)" : "var(--muted)";
}

function toggleAuthForms(elements, showRegister) {
  elements.loginForm.classList.toggle("hidden", showRegister);
  elements.registerForm.classList.toggle("hidden", !showRegister);
}

// Catálogo, carrito y despacho son públicos; el login se muestra cuando el visitante quiere comprar o lo pide.
export function showCatalog(elements) {
  elements.authPanel.classList.add("hidden");
  elements.catalogWrapper.classList.remove("hidden");
  elements.cartPanel.classList.add("hidden");
  elements.shippingPanel.classList.add("hidden");
  elements.productsGrid.classList.remove("hidden");
}

export function showAuthPanel(elements, message = "") {
  elements.catalogWrapper.classList.add("hidden");
  elements.authPanel.classList.remove("hidden");
  toggleAuthForms(elements, false);
  setAuthMessage(elements, message);
}

export function renderAuthState(elements, onLoggedIn) {
  const loggedIn = isLoggedIn();
  showCatalog(elements);
  elements.loginBtn.classList.toggle("hidden", loggedIn);
  elements.logoutBtn.classList.toggle("hidden", !loggedIn);

  if (loggedIn) {
    setStatus(elements, `Sesión activa para ${getCurrentUser().email}`, "success");
    onLoggedIn();
    return;
  }
  setAuthMessage(elements, "");
}

export function attachAuthEvents(elements, callbacks) {
  elements.loginBtn.addEventListener("click", () => showAuthPanel(elements));
  elements.showRegisterBtn.addEventListener("click", () => toggleAuthForms(elements, true));
  elements.showLoginBtn.addEventListener("click", () => toggleAuthForms(elements, false));

  elements.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    if (!email || !password) {
      setAuthMessage(elements, "Debes ingresar email y contraseña.", "error");
      return;
    }

    try {
      const result = await loginUser({ email, password });
      startSession(result.user, result.token);
      setAuthMessage(elements, "Sesión iniciada correctamente.", "success");
      elements.loginForm.reset();
      callbacks.onLogin(result.user);
    } catch (error) {
      setAuthMessage(elements, error.message || "No se pudo iniciar sesión.", "error");
    }
  });

  elements.registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value.trim();

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
      setAuthMessage(elements, error.message || "No se pudo registrar el usuario.", "error");
    }
  });

  elements.logoutBtn.addEventListener("click", () => {
    endSession();
    callbacks.onLogout();
    setAuthMessage(elements, "Sesión cerrada.", "success");
  });
}