// Elementos de index.html que usa la aplicación, cada uno con su tipo (input, select, botón...).
// Si falta un id en el HTML, la página falla al iniciar con un mensaje claro en vez de fallar más adelante.

type ElementClass<T extends HTMLElement> = { new (): T; prototype: T };

function byId(id: string): HTMLElement;
function byId<T extends HTMLElement>(id: string, type: ElementClass<T>): T;
function byId<T extends HTMLElement>(id: string, type?: ElementClass<T>): HTMLElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Falta el elemento #${id} en index.html`);
  }
  if (type && !(element instanceof type)) {
    throw new Error(`El elemento #${id} no es del tipo esperado (${type.name})`);
  }
  return element;
}

export function createElements() {
  return {
    // Encabezado
    headerActions: byId("headerActions"),
    reloadBtn: byId("reloadBtn", HTMLButtonElement),
    loginBtn: byId("loginBtn", HTMLButtonElement),
    logoutBtn: byId("logoutBtn", HTMLButtonElement),
    cartBtn: byId("cartBtn", HTMLButtonElement),
    cartCount: byId("cartCount"),
    shippingBtn: byId("shippingBtn", HTMLButtonElement),
    quoteBtn: byId("quoteBtn", HTMLButtonElement),
    quoteCount: byId("quoteCount"),

    // Inicio de sesión y registro
    authPanel: byId("authPanel"),
    loginForm: byId("loginForm", HTMLFormElement),
    loginEmail: byId("email", HTMLInputElement),
    loginPassword: byId("password", HTMLInputElement),
    loginAuthMessage: byId("loginAuthMessage"),
    showRegisterBtn: byId("showRegisterBtn", HTMLButtonElement),
    registerForm: byId("registerForm", HTMLFormElement),
    registerName: byId("registerName", HTMLInputElement),
    registerEmail: byId("registerEmail", HTMLInputElement),
    registerPassword: byId("registerPassword", HTMLInputElement),
    registerAuthMessage: byId("registerAuthMessage"),
    showLoginBtn: byId("showLoginBtn", HTMLButtonElement),

    // Catálogo
    catalogWrapper: byId("catalogWrapper"),
    statusMessage: byId("statusMessage"),
    catalogLayout: byId("catalogLayout"),
    productSearchForm: byId("productSearchForm", HTMLFormElement),
    productSearch: byId("productSearch", HTMLInputElement),
    categoriesToggle: byId("categoriesToggle", HTMLButtonElement),
    categoriesContainer: byId("categoriesContainer"),
    productsGrid: byId("productsGrid"),

    // Administración
    adminPanel: byId("adminPanel"),
    adminProducts: byId("adminProducts"),
    adminReservations: byId("adminReservations"),
    adminReservationsMap: byId("adminReservationsMap"),
    newCategoryForm: byId("newCategoryForm", HTMLFormElement),
    newCategoryName: byId("newCategoryName", HTMLInputElement),
    newCategoryGroup: byId("newCategoryGroup", HTMLInputElement),
    newCategoryDescription: byId("newCategoryDescription", HTMLInputElement),
    categoryGroupOptions: byId("categoryGroupOptions", HTMLDataListElement),
    newCategoryMessage: byId("newCategoryMessage"),
    newProductForm: byId("newProductForm", HTMLFormElement),
    newProductName: byId("newProductName", HTMLInputElement),
    newProductCategory: byId("newProductCategory", HTMLSelectElement),
    newProductPrice: byId("newProductPrice", HTMLInputElement),
    newProductStock: byId("newProductStock", HTMLInputElement),
    newProductMaterial: byId("newProductMaterial", HTMLInputElement),
    newProductDiameter: byId("newProductDiameter", HTMLInputElement),
    newProductPressure: byId("newProductPressure", HTMLInputElement),
    newProductImage: byId("newProductImage", HTMLInputElement),
    newProductDescription: byId("newProductDescription", HTMLTextAreaElement),
    newProductMessage: byId("newProductMessage"),

    adminQuotes: byId("adminQuotes"),

    // Cotización
    quotePanel: byId("quotePanel"),
    closeQuoteBtn: byId("closeQuoteBtn", HTMLButtonElement),
    quoteEditor: byId("quoteEditor"),
    quoteItemsList: byId("quoteItemsList"),
    quoteSummary: byId("quoteSummary"),
    quoteTotal: byId("quoteTotal"),
    quoteForm: byId("quoteForm", HTMLFormElement),
    quoteName: byId("quoteName", HTMLInputElement),
    quoteEmail: byId("quoteEmail", HTMLInputElement),
    quotePhone: byId("quotePhone", HTMLInputElement),
    quoteCompany: byId("quoteCompany", HTMLInputElement),
    quoteRut: byId("quoteRut", HTMLInputElement),
    quoteNotes: byId("quoteNotes", HTMLTextAreaElement),
    quoteFormMessage: byId("quoteFormMessage"),
    quoteResult: byId("quoteResult"),

    // Carrito
    cartPanel: byId("cartPanel"),
    closeCartBtn: byId("closeCartBtn", HTMLButtonElement),
    cartItemsList: byId("cartItemsList"),
    cartTotal: byId("cartTotal"),

    // Despacho
    shippingPanel: byId("shippingPanel"),
    closeShippingBtn: byId("closeShippingBtn", HTMLButtonElement),
    shippingAddressField: byId("shippingAddressField"),
    shippingRegion: byId("shippingRegion", HTMLSelectElement),
    shippingCity: byId("shippingCity", HTMLSelectElement),
    shippingAddress: byId("shippingAddress", HTMLInputElement),
    shippingMapHint: byId("shippingMapHint"),
    shippingMap: byId("shippingMap"),
    shippingQuote: byId("shippingQuote"),
    previousMonthBtn: byId("previousMonthBtn", HTMLButtonElement),
    nextMonthBtn: byId("nextMonthBtn", HTMLButtonElement),
    calendarMonthLabel: byId("calendarMonthLabel"),
    calendarGrid: byId("calendarGrid"),
    selectedDateLabel: byId("selectedDateLabel"),
    deliveryDate: byId("deliveryDate", HTMLInputElement),
    reservationList: byId("reservationList"),
    confirmShippingBtn: byId("confirmShippingBtn", HTMLButtonElement),
  };
}

export type AppElements = ReturnType<typeof createElements>;
