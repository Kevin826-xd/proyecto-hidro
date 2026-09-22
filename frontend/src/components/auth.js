import { endSession, getCurrentUser, isLoggedIn, startSession } from "../services/sessionService.js";
import { loginUser, registerUser } from "../services/userService.js";

export function setStatus(elements, message, type = "info") {
  elements.statusMessage.textContent = message;
  elements.statusMessage.style.color = type === "error" ? "#b91c1c" : type === "success" ? "#166534" : "#475569";
}

export function setAuthMessage(elements, message, type = "info") {
  const activeMessage = elements.registerForm && !elements.registerForm.classList.contains("hidden")
    ? elements.registerAuthMessage
    : elements.loginAuthMessage;

  if (!activeMessage) {
    return;
  }

  activeMessage.textContent = message;
  activeMessage.style.color = type === "error" ? "#b91c1c" : type === "success" ? "#166534" : "#475569";
}

function toggleAuthForms(elements, showRegister) {
  elements.loginForm.classList.toggle("hidden", showRegister);
  elements.registerForm.classList.toggle("hidden", !showRegister);
}

export function renderAuthState(elements, onLoggedIn) {
  if (isLoggedIn()) {
    elements.authPanel.classList.add("hidden");
    elements.catalogWrapper.classList.remove("hidden");
    elements.logoutBtn.classList.remove("hidden");
    setStatus(elements, `Sesión activa para ${getCurrentUser().email}`, "success");
    onLoggedIn();
    return;
  }
  elements.authPanel.classList.remove("hidden");
  elements.catalogWrapper.classList.add("hidden");
  elements.logoutBtn.classList.add("hidden");
  elements.cartPanel.classList.add("hidden");
  setStatus(elements, "Inicia sesión para ver nuestros servicios.");
  setAuthMessage(elements, "");
  toggleAuthForms(elements, false);
}

export function attachAuthEvents(elements, callbacks) {
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
      startSession(result.user);
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
      startSession(result.user);
      setAuthMessage(elements, "Usuario registrado correctamente.", "success");
      elements.registerForm.reset();
      toggleAuthForms(elements, false);
      callbacks.onLogin(result.user);
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