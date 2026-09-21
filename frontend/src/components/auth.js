import { endSession, getCurrentUser, isLoggedIn, startSession } from "../services/sessionService.js";

export function setStatus(elements, message, type = "info") {
  elements.statusMessage.textContent = message;
  elements.statusMessage.style.color = type === "error" ? "#b91c1c" : type === "success" ? "#166534" : "#475569";
}

export function setAuthMessage(elements, message, type = "info") {
  elements.authMessage.textContent = message;
  elements.authMessage.style.color = type === "error" ? "#b91c1c" : type === "success" ? "#166534" : "#475569";
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
}

export function attachAuthEvents(elements, callbacks) {
  elements.loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    if (!email || !password) {
      setAuthMessage(elements, "Debes ingresar email y contraseña.", "error");
      return;
    }
    startSession(email);
    setAuthMessage(elements, "Sesión iniciada correctamente.", "success");
    elements.loginForm.reset();
    callbacks.onLogin();
  });
  elements.logoutBtn.addEventListener("click", () => {
    endSession();
    callbacks.onLogout();
    setAuthMessage(elements, "Sesión cerrada.", "success");
  });
}