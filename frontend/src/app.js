const productsGrid = document.getElementById("productsGrid");
const statusMessage = document.getElementById("statusMessage");
const reloadBtn = document.getElementById("reloadBtn");
const authPanel = document.getElementById("authPanel");
const catalogWrapper = document.getElementById("catalogWrapper");
const logoutBtn = document.getElementById("logoutBtn");
const loginForm = document.getElementById("loginForm");
const authMessage = document.getElementById("authMessage");
const SESSION_KEY = "hidrocenter_session";

const formatPrice = (value) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

function setStatus(message, type = "info") {
  statusMessage.textContent = message;
  statusMessage.style.color = type === "error" ? "#b91c1c" : type === "success" ? "#166534" : "#475569";
}

function setAuthMessage(message, type = "info") {
  authMessage.textContent = message;
  authMessage.style.color = type === "error" ? "#b91c1c" : type === "success" ? "#166534" : "#475569";
}

function isLoggedIn() {
  return Boolean(window.localStorage.getItem(SESSION_KEY));
}

function renderAuthState() {
  if (isLoggedIn()) {
    authPanel.classList.add("hidden");
    catalogWrapper.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    const currentUser = JSON.parse(window.localStorage.getItem(SESSION_KEY));
    setStatus(`Sesión activa para ${currentUser.email}`, "success");
    return;
  }

  authPanel.classList.remove("hidden");
  catalogWrapper.classList.add("hidden");
  logoutBtn.classList.add("hidden");
  setStatus("Inicia sesión para ver el catálogo.", "info");
  setAuthMessage("", "info");
}

function renderProducts(products) {
  if (!Array.isArray(products) || products.length === 0) {
    productsGrid.innerHTML = `
      <div class="empty-state">
        <h2>No hay productos disponibles</h2>
        <p>Pronto se publicarán nuevos insumos para el catálogo.</p>
      </div>
    `;
    return;
  }

  productsGrid.innerHTML = products
    .map(
      (product) => `
        <article class="product-card">
          <span class="product-tag">${product.material || "Producto"}</span>
          <h2>${product.name}</h2>
          <p class="product-price">${formatPrice(product.price)}</p>

          <div class="product-meta">
            <div class="meta-row">
              <span class="meta-label">Stock</span>
              <span>${product.stock}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Diámetro</span>
              <span>${product.diameter || "—"}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Material</span>
              <span>${product.material || "—"}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Presión</span>
              <span>${product.workingPressure || "—"}</span>
            </div>
          </div>

          <p>${product.description || "Sin descripción disponible."}</p>
        </article>
      `,
    )
    .join("");
}

async function loadProducts() {
  if (!isLoggedIn()) {
    renderProducts([]);
    return;
  }

  setStatus("Cargando productos...");

  try {
    const products = await getProducts();
    renderProducts(products);
    setStatus(`Mostrando ${products.length} productos disponibles`, "success");
  } catch (error) {
    console.error(error);
    productsGrid.innerHTML = `
      <div class="empty-state">
        <h2>No pudimos cargar el catálogo</h2>
        <p>Revisa que el backend esté corriendo en http://localhost:3000.</p>
      </div>
    `;
    setStatus("Error al cargar el catálogo.", "error");
  }
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    setAuthMessage("Debes ingresar email y contraseña.", "error");
    return;
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ email }));
  setAuthMessage("Sesión iniciada correctamente.", "success");
  loginForm.reset();
  renderAuthState();
  loadProducts();
});

logoutBtn.addEventListener("click", () => {
  window.localStorage.removeItem(SESSION_KEY);
  setAuthMessage("Sesión cerrada.", "success");
  renderAuthState();
  renderProducts([]);
});

reloadBtn.addEventListener("click", loadProducts);
renderAuthState();
renderProducts([]);
