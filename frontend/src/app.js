const productsGrid = document.getElementById("productsGrid");
const statusMessage = document.getElementById("statusMessage");
const reloadBtn = document.getElementById("reloadBtn");
const authPanel = document.getElementById("authPanel");
const catalogWrapper = document.getElementById("catalogWrapper");
const logoutBtn = document.getElementById("logoutBtn");
const loginForm = document.getElementById("loginForm");
const authMessage = document.getElementById("authMessage");
const cartBtn = document.getElementById("cartBtn");
const cartPanel = document.getElementById("cartPanel");
const shippingBtn = document.getElementById("shippingBtn");
const shippingPanel = document.getElementById("shippingPanel");
const closeShippingBtn = document.getElementById("closeShippingBtn");
const shippingAddressField = document.getElementById("shippingAddressField");
const shippingCity = document.getElementById("shippingCity");
const shippingAddress = document.getElementById("shippingAddress");
const deliveryDate = document.getElementById("deliveryDate");
const previousMonthBtn = document.getElementById("previousMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");
const calendarMonthLabel = document.getElementById("calendarMonthLabel");
const calendarGrid = document.getElementById("calendarGrid");
const selectedDateLabel = document.getElementById("selectedDateLabel");
const reservationList = document.getElementById("reservationList");
const confirmShippingBtn = document.getElementById("confirmShippingBtn");
const cartItemsList = document.getElementById("cartItemsList");
const cartTotal = document.getElementById("cartTotal");
const cartCount = document.getElementById("cartCount");
const closeCartBtn = document.getElementById("closeCartBtn");
const SESSION_KEY = "hidrocenter_session";
const FALLBACK_PRODUCTS = [
  {
    id: "demo-gotero",
    name: "Gotero",
    description: "Gotero para riego por goteo, ideal para sistemas domésticos e industriales.",
    price: 100,
    stock: 20,
    categoryId: "demo-category",
    diameter: "16",
    material: "PVC",
    workingPressure: "2",
  },
];

let cartItems = [];
let selectedShippingMethod = "pickup";
let selectedDeliveryDate = "";
let savedDeliveryDate = "";
let reservedDeliveryCity = "";
let reservedDeliveryAddress = "";
let deliveryReservations = [];
let reservedDeliveryDates = [];
let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

const shippingLabels = {
  pickup: "retiro en tienda",
  home: "despacho a domicilio",
  express: "despacho express",
};

function updateShippingPanel() {
  const requiresAddress = selectedShippingMethod !== "pickup";
  shippingAddressField.classList.toggle("hidden", !requiresAddress);
  confirmShippingBtn.textContent = selectedDeliveryDate
    ? `Reservar ${shippingLabels[selectedShippingMethod]}`
    : "Reservar día de despacho";
}

function updateSelectedDateLabel() {
  if (!selectedDeliveryDate) {
    selectedDateLabel.textContent = "Selecciona un día disponible.";
    return;
  }

  const formattedDate = new Date(`${selectedDeliveryDate}T00:00:00`).toLocaleDateString("es-CL", {
    dateStyle: "long",
  });
  const isSavedDate = selectedDeliveryDate === savedDeliveryDate;
  const city = isSavedDate ? reservedDeliveryCity : shippingCity.value.trim();
  const address = isSavedDate ? reservedDeliveryAddress : shippingAddress.value.trim();
  const location = city && address
    ? ` Ciudad: ${city}. Dirección: ${address}.`
    : "";
  selectedDateLabel.textContent = `Día reservado: ${formattedDate}.${location}`;
}

function renderReservationHistory() {
  if (!deliveryReservations.length) {
    reservationList.innerHTML = '<p class="empty-reservations">Todavía no tienes reservas.</p>';
    return;
  }

  reservationList.innerHTML = deliveryReservations
    .map((reservation) => {
      const date = new Date(`${reservation.deliveryDate}T00:00:00`).toLocaleDateString("es-CL", {
        dateStyle: "long",
      });
      const location = reservation.deliveryCity && reservation.deliveryAddress
        ? `${reservation.deliveryCity} - ${reservation.deliveryAddress}`
        : "Retiro en tienda";
      return `<div class="reservation-item"><strong>${date}</strong><span>${location}</span></div>`;
    })
    .join("");
}

function showShippingView(show) {
  shippingPanel.classList.toggle("hidden", !show);
  productsGrid.classList.toggle("hidden", show);
}

function getTodayForCalendar() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function renderCalendar() {
  const monthName = calendarMonth.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  calendarMonthLabel.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const today = getTodayForCalendar();
  const cells = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push('<span class="calendar-day calendar-day-empty" aria-hidden="true"></span>');
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    const dateKey = getDateKey(date);
    const isPast = dateKey < today;
    const isSelected = dateKey === selectedDeliveryDate;
    const isReserved = reservedDeliveryDates.includes(dateKey);
    const classes = ["calendar-day", isSelected ? "selected" : "", isReserved ? "reserved" : "", dateKey === today ? "today" : ""]
      .filter(Boolean)
      .join(" ");

    cells.push(`
      <button class="${classes}" type="button" data-date="${dateKey}" ${isPast || isReserved ? "disabled" : ""}>
        <span>${day}</span>
      </button>
    `);
  }

  calendarGrid.innerHTML = cells.join("");
  previousMonthBtn.disabled = calendarMonth.getFullYear() === new Date().getFullYear()
    && calendarMonth.getMonth() === new Date().getMonth();
  updateSelectedDateLabel();

  calendarGrid.querySelectorAll(".calendar-day:not(.calendar-day-empty)").forEach((dayButton) => {
    dayButton.addEventListener("click", () => {
      selectedDeliveryDate = dayButton.dataset.date;
      deliveryDate.value = selectedDeliveryDate;
      updateShippingPanel();
      renderCalendar();
    });
  });

  const selectedDay = calendarGrid.querySelector(".calendar-day.selected");
  const isSavedDate = selectedDeliveryDate === savedDeliveryDate;
  const city = isSavedDate ? reservedDeliveryCity : shippingCity.value.trim();
  const address = isSavedDate ? reservedDeliveryAddress : shippingAddress.value.trim();
  if (selectedDay && city && address) {
    const locationLabel = document.createElement("small");
    locationLabel.className = "calendar-day-location";
    locationLabel.textContent = `${city} - ${address}`;
    selectedDay.append(locationLabel);
  }
}

const formatPrice = (value) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

function getCurrentUser() {
  const session = window.localStorage.getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
}

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

function renderCart() {
  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.subtotal || item.price * item.quantity), 0);

  cartTotal.textContent = formatPrice(subtotal);
  cartCount.textContent = String(cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0));

  if (!cartItems.length) {
    cartItemsList.innerHTML = `
      <div class="empty-cart">
        <p>Tu carrito está vacío.</p>
      </div>
    `;
    return;
  }

  cartItemsList.innerHTML = cartItems
    .map(
      (item) => `
        <div class="cart-item" data-product-id="${item.productId}">
          <div>
            <strong>${item.name}</strong>
            <p>${formatPrice(item.price)} c/u</p>
          </div>

          <div class="cart-item-actions">
            <button class="qty-button" type="button" data-action="decrease" data-product-id="${item.productId}">-</button>
            <span>${item.quantity}</span>
            <button class="qty-button" type="button" data-action="increase" data-product-id="${item.productId}">+</button>
            <button class="remove-button" type="button" data-action="remove" data-product-id="${item.productId}">Quitar</button>
          </div>
        </div>
      `,
    )
    .join("");
}

async function syncCartFromServer() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    cartItems = [];
    renderCart();
    return;
  }

  try {
    const cart = await getCart(currentUser.email);
    cartItems = cart.items || [];
    selectedDeliveryDate = cart.deliveryDate || "";
    savedDeliveryDate = selectedDeliveryDate;
    reservedDeliveryCity = cart.deliveryCity || "";
    reservedDeliveryAddress = cart.deliveryAddress || "";
    deliveryReservations = Array.isArray(cart.deliveryReservations) ? cart.deliveryReservations : [];
    shippingCity.value = cart.deliveryCity || "";
    shippingAddress.value = cart.deliveryAddress || "";
    deliveryDate.value = selectedDeliveryDate;
    if (selectedDeliveryDate) {
      const savedDate = new Date(`${selectedDeliveryDate}T00:00:00`);
      calendarMonth = new Date(savedDate.getFullYear(), savedDate.getMonth(), 1);
    }
    renderCalendar();
    renderReservationHistory();
    updateShippingPanel();
    renderCart();
  } catch (error) {
    console.error(error);
    cartItems = [];
    renderCart();
  }
}

function renderAuthState() {
  if (isLoggedIn()) {
    authPanel.classList.add("hidden");
    catalogWrapper.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    const currentUser = getCurrentUser();
    setStatus(`Sesión activa para ${currentUser.email}`, "success");
    syncCartFromServer();
    return;
  }

  authPanel.classList.remove("hidden");
  catalogWrapper.classList.add("hidden");
  logoutBtn.classList.add("hidden");
  cartPanel.classList.add("hidden");
  setStatus("Inicia sesión para ver el catálogo.", "info");
  setAuthMessage("", "info");
}

function renderProducts(products) {
  if (!Array.isArray(products) || products.length === 0) {
    const demoProducts = FALLBACK_PRODUCTS;
    productsGrid.innerHTML = demoProducts
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

            <button class="button add-to-cart-btn" type="button" data-product-id="${product.id}" data-product-name="${product.name}" data-product-price="${product.price}">
              Agregar al carrito
            </button>
          </article>
        `,
      )
      .join("");

    document.querySelectorAll(".add-to-cart-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const product = {
          id: button.dataset.productId,
          name: button.dataset.productName,
          price: Number(button.dataset.productPrice),
        };

        await addProductToCart(product);
      });
    });
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

          <button class="button add-to-cart-btn" type="button" data-product-id="${product.id}" data-product-name="${product.name}" data-product-price="${product.price}">
            Agregar al carrito
          </button>
        </article>
      `,
    )
    .join("");

  document.querySelectorAll(".add-to-cart-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const product = {
        id: button.dataset.productId,
        name: button.dataset.productName,
        price: Number(button.dataset.productPrice),
      };

      await addProductToCart(product);
    });
  });
}

async function addProductToCart(product) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    setStatus("Debes iniciar sesión para agregar productos al carrito.", "error");
    return;
  }

  try {
    const updatedCart = await addCartItem(
      {
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: 1,
      },
      currentUser.email,
    );

    cartItems = updatedCart.items || [];
    renderCart();
    setStatus(`${product.name} agregado al carrito.`, "success");
  } catch (error) {
    console.error(error);
    setStatus(error.message || "No se pudo agregar el producto.", "error");
  }
}

async function updateCartQuantity(productId, nextQuantity) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return;
  }

  try {
    const updatedCart = await updateCartItemQuantity(productId, nextQuantity, currentUser.email);
    cartItems = updatedCart.items || [];
    renderCart();
  } catch (error) {
    console.error(error);
    setStatus(error.message || "No se pudo actualizar la cantidad.", "error");
  }
}

async function removeProductFromCart(productId) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return;
  }

  try {
    const updatedCart = await removeCartItem(productId, currentUser.email);
    cartItems = updatedCart.items || [];
    renderCart();
    setStatus("Producto quitado del carrito.", "success");
  } catch (error) {
    console.error(error);
    setStatus(error.message || "No se pudo quitar el producto.", "error");
  }
}

async function loadProducts() {
  if (!isLoggedIn()) {
    renderProducts([]);
    return;
  }

  setStatus("Cargando productos...");

  try {
    const products = await getProducts();
    if (Array.isArray(products) && products.length > 0) {
      renderProducts(products);
      setStatus(`Mostrando ${products.length} productos disponibles`, "success");
      return;
    }

    renderProducts(FALLBACK_PRODUCTS);
    setStatus("Mostrando producto de ejemplo disponible", "success");
  } catch (error) {
    console.error(error);
    renderProducts(FALLBACK_PRODUCTS);
    setStatus("Mostrando producto de ejemplo disponible", "success");
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
  cartItems = [];
  selectedDeliveryDate = "";
  savedDeliveryDate = "";
  reservedDeliveryCity = "";
  reservedDeliveryAddress = "";
  deliveryReservations = [];
  shippingCity.value = "";
  shippingAddress.value = "";
  calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  renderCalendar();
  renderCart();
  setAuthMessage("Sesión cerrada.", "success");
  renderAuthState();
  renderProducts([]);
});

reloadBtn.addEventListener("click", loadProducts);

cartBtn.addEventListener("click", () => {
  cartPanel.classList.toggle("hidden");
  showShippingView(false);
});

closeCartBtn.addEventListener("click", () => {
  cartPanel.classList.add("hidden");
});

shippingBtn.addEventListener("click", () => {
  const shouldShowShipping = shippingPanel.classList.contains("hidden");
  cartPanel.classList.add("hidden");
  if (shouldShowShipping) {
    getReservedDeliveryDates()
      .then((dates) => {
        reservedDeliveryDates = Array.isArray(dates) ? dates : [];
        renderCalendar();
      })
      .catch((error) => console.error(error));
  }
  showShippingView(shouldShowShipping);
});

closeShippingBtn.addEventListener("click", () => {
  showShippingView(false);
});

shippingPanel.querySelectorAll(".shipping-option").forEach((option) => {
  option.addEventListener("click", () => {
    selectedShippingMethod = option.dataset.method;
    shippingPanel.querySelectorAll(".shipping-option").forEach((item) => {
      item.classList.toggle("active", item === option);
    });
    updateShippingPanel();
  });
});

previousMonthBtn.addEventListener("click", () => {
  if (previousMonthBtn.disabled) {
    return;
  }

  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
  renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
  renderCalendar();
});

confirmShippingBtn.addEventListener("click", async () => {
  if (selectedShippingMethod !== "pickup" && !shippingCity.value.trim()) {
    setStatus("Ingresa la ciudad de despacho.", "error");
    shippingCity.focus();
    return;
  }

  if (selectedShippingMethod !== "pickup" && !shippingAddress.value.trim()) {
    setStatus("Ingresa una dirección para el despacho.", "error");
    shippingAddress.focus();
    return;
  }

  if (!deliveryDate.value) {
    setStatus("Selecciona un día para reservar el despacho.", "error");
    return;
  }

  const currentUser = getCurrentUser();

  try {
    const updatedCart = await updateCartDeliveryDate(
      deliveryDate.value,
      shippingCity.value,
      shippingAddress.value,
      currentUser.email,
    );
    selectedDeliveryDate = updatedCart.deliveryDate;
    savedDeliveryDate = selectedDeliveryDate;
    reservedDeliveryCity = updatedCart.deliveryCity || "";
    reservedDeliveryAddress = updatedCart.deliveryAddress || "";
    deliveryReservations = Array.isArray(updatedCart.deliveryReservations)
      ? updatedCart.deliveryReservations
      : [...deliveryReservations, {
          deliveryDate: selectedDeliveryDate,
          deliveryCity: reservedDeliveryCity,
          deliveryAddress: reservedDeliveryAddress,
        }];
    shippingCity.value = "";
    shippingAddress.value = "";
    updateSelectedDateLabel();
    renderCalendar();
    renderReservationHistory();
    updateShippingPanel();
    setStatus(`Despacho reservado para el ${selectedDeliveryDate}.`, "success");
    showShippingView(false);
  } catch (error) {
    console.error(error);
    setStatus(error.message || "No se pudo reservar el día de despacho.", "error");
  }
});

cartItemsList.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const productId = button.dataset.productId;
  const action = button.dataset.action;

  if (!productId || !action) {
    return;
  }

  const currentItem = cartItems.find((item) => String(item.productId) === String(productId));
  if (!currentItem) {
    return;
  }

  if (action === "increase") {
    await updateCartQuantity(productId, currentItem.quantity + 1);
    return;
  }

  if (action === "decrease") {
    await updateCartQuantity(productId, currentItem.quantity - 1);
    return;
  }

  if (action === "remove") {
    await removeProductFromCart(productId);
  }
});

renderAuthState();
renderProducts([]);
renderCart();
renderCalendar();
renderReservationHistory();
updateShippingPanel();
