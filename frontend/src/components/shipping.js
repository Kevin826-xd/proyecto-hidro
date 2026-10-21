import { CHILE_REGIONS, findRegionByCity, getCitiesByRegion, getRegionCenter } from "../config/chileRegions.js";
import { SHIPPING_LABELS } from "../config/constants.js";
import { editCartDeliveryReservation, getReservedDeliveryDates, getShippingQuote, removeCartDeliveryReservation, updateCartDeliveryDate } from "../services/cartService.js";
import { getCurrentUser } from "../services/sessionService.js";
import { formatDate, formatDistance, formatPrice, getDateKey, getTodayForCalendar } from "../utils/formatters.js";
import { createLocationPicker, geocodeAddress, geocodeCity, hasLocation } from "./deliveryMap.js";

const MAP_HINT = "Elige la región y la ciudad, escribe la dirección y la marcaremos en el mapa. También puedes hacer clic en el mapa.";
const MAP_HINT_MARKED = "Ubicación marcada. Puedes arrastrar el pin para ajustarla.";
const MAP_HINT_SEARCHING = "Buscando la dirección en el mapa...";
const MAP_HINT_NOT_FOUND = "No encontramos esa dirección. Haz clic en el mapa para marcar la ubicación.";
const MAP_HINT_APPROXIMATE = "Encontramos la ciudad, pero no la dirección exacta. Haz clic en el mapa para marcar la ubicación.";
const MAP_HINT_ERROR = "No se pudo buscar la dirección. Haz clic en el mapa para marcar la ubicación.";
const MAP_HINT_REGION = "Ahora elige la ciudad para acercar el mapa.";
const MAP_HINT_SEARCHING_CITY = "Buscando la ciudad en el mapa...";
const MAP_HINT_CITY = "Escribe la dirección o haz clic en el mapa para marcar la ubicación.";
const MAP_HINT_CITY_NOT_FOUND = "No encontramos la ciudad en el mapa. Escribe la dirección o haz clic en el mapa.";
const GEOCODE_DELAY_MS = 1000;
const QUOTE_DELAY_MS = 400;
const CITY_ZOOM = 14;

let locationPicker = null;
let geocodeTimer = null;
let geocodeController = null;
let lastGeocodeQuery = "";
let quoteTimer = null;
let quoteController = null;

function showQuote(elements, text) {
  elements.shippingQuote.textContent = text;
  elements.shippingQuote.classList.toggle("hidden", !text);
}

function updateShippingQuote(elements, location) {
  clearTimeout(quoteTimer);
  quoteController?.abort();
  quoteController = null;

  if (!location) {
    showQuote(elements, "");
    return;
  }

  showQuote(elements, "Calculando el costo del despacho...");
  quoteTimer = setTimeout(async () => {
    const controller = new AbortController();
    quoteController = controller;
    try {
      const quote = await getShippingQuote(location, controller.signal);
      const distanceLabel = `${formatDistance(quote.distanceKm)}${quote.byRoad ? " por calle" : " en línea recta"}`;
      showQuote(elements, `Distancia: ${distanceLabel} · Costo del despacho: ${formatPrice(quote.cost)} (${formatPrice(quote.pricePerKm)} por km)`);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error(error);
      showQuote(elements, "No se pudo calcular el costo. Se calculará al reservar.");
    }
  }, QUOTE_DELAY_MS);
}

function describeDeliveryCost(reservation) {
  return Number.isFinite(reservation.deliveryCost)
    ? `${formatPrice(reservation.deliveryCost)} · ${formatDistance(reservation.deliveryDistanceKm)}`
    : "";
}

function renderOptions(select, placeholder, values) {
  select.innerHTML = [placeholder, ...values]
    .map((value, index) => `<option value="${index ? value : ""}">${value}</option>`)
    .join("");
}

function renderCityOptions(elements, region) {
  const cities = [...getCitiesByRegion(region)].sort((a, b) => a.localeCompare(b, "es"));
  renderOptions(elements.shippingCity, region ? "Selecciona una ciudad" : "Primero selecciona una región", cities);
  elements.shippingCity.disabled = !region;
}

function renderRegionOptions(elements) {
  if (elements.shippingRegion.options.length > 1) return;
  renderOptions(elements.shippingRegion, "Selecciona una región", CHILE_REGIONS.map((region) => region.name));
}

export function setDeliveryArea(elements, city = "") {
  renderRegionOptions(elements);
  const region = findRegionByCity(city);
  elements.shippingRegion.value = region;
  renderCityOptions(elements, region);
  elements.shippingCity.value = getCitiesByRegion(region).find((item) => item.toLowerCase() === city.trim().toLowerCase()) ?? "";
}

function getGeocodeQuery(city, address) {
  return `${city}|${address}`.toLowerCase();
}

function cancelAddressLookup() {
  clearTimeout(geocodeTimer);
  geocodeController?.abort();
  geocodeController = null;
}

async function locateAddress(elements) {
  const city = elements.shippingCity.value.trim();
  const address = elements.shippingAddress.value.trim();
  const query = getGeocodeQuery(city, address);
  if (!city || address.length < 3 || query === lastGeocodeQuery) return;

  cancelAddressLookup();
  const controller = new AbortController();
  geocodeController = controller;
  lastGeocodeQuery = query;
  elements.shippingMapHint.textContent = MAP_HINT_SEARCHING;

  try {
    const location = await geocodeAddress(city, address, { region: elements.shippingRegion.value, signal: controller.signal });
    if (!location) {
      locationPicker.clear();
      elements.shippingMapHint.textContent = MAP_HINT_NOT_FOUND;
    } else if (location.approximate) {
      locationPicker.clear();
      locationPicker.centerOn(location, CITY_ZOOM);
      elements.shippingMapHint.textContent = MAP_HINT_APPROXIMATE;
    } else {
      locationPicker.setLocation(location, { center: true });
    }
  } catch (error) {
    if (error.name === "AbortError") return;
    console.error(error);
    lastGeocodeQuery = "";
    elements.shippingMapHint.textContent = MAP_HINT_ERROR;
  } finally {
    if (geocodeController === controller) geocodeController = null;
  }
}

function showRegion(elements) {
  cancelAddressLookup();
  lastGeocodeQuery = "";
  locationPicker.clear();
  const center = getRegionCenter(elements.shippingRegion.value);
  if (center) {
    locationPicker.centerOn(center, center.zoom);
    elements.shippingMapHint.textContent = MAP_HINT_REGION;
  }
}

// Centra el mapa en la ciudad elegida, sin necesitar la dirección.
async function locateCity(elements) {
  const city = elements.shippingCity.value;
  if (!city) {
    showRegion(elements);
    return;
  }

  cancelAddressLookup();
  lastGeocodeQuery = "";
  locationPicker.clear();
  const controller = new AbortController();
  geocodeController = controller;
  elements.shippingMapHint.textContent = MAP_HINT_SEARCHING_CITY;

  try {
    const location = await geocodeCity(city, { region: elements.shippingRegion.value, signal: controller.signal });
    if (location) locationPicker.centerOn(location, CITY_ZOOM);
    elements.shippingMapHint.textContent = location ? MAP_HINT_CITY : MAP_HINT_CITY_NOT_FOUND;
  } catch (error) {
    if (error.name === "AbortError") return;
    console.error(error);
    elements.shippingMapHint.textContent = MAP_HINT_CITY_NOT_FOUND;
  } finally {
    if (geocodeController === controller) geocodeController = null;
  }
}

function scheduleAddressLookup(elements) {
  clearTimeout(geocodeTimer);
  geocodeTimer = setTimeout(() => locateAddress(elements), GEOCODE_DELAY_MS);
}

function resetAddressLookup(query = "") {
  cancelAddressLookup();
  lastGeocodeQuery = query;
}

function refreshMapIfVisible(elements) {
  if (locationPicker && elements.shippingMap.offsetParent !== null) {
    locationPicker.refresh();
  }
}

export function clearDeliveryLocation() {
  resetAddressLookup();
  locationPicker?.clear();
}

function selectShippingMethod(elements, state, method) {
  state.selectedShippingMethod = method;
  elements.shippingPanel.querySelectorAll(".shipping-option").forEach((item) => item.classList.toggle("active", item.dataset.method === method));
  updateShippingPanel(elements, state);
}

export function updateShippingPanel(elements, state) {
  const requiresAddress = state.selectedShippingMethod !== "pickup";
  elements.shippingAddressField.classList.toggle("hidden", !requiresAddress);
  elements.confirmShippingBtn.textContent = state.editingDeliveryDate
    ? "Guardar cambios"
    : state.selectedDeliveryDate
      ? `Reservar ${SHIPPING_LABELS[state.selectedShippingMethod]}`
      : "Reservar día de despacho";
  refreshMapIfVisible(elements);
}

export function renderReservationHistory(elements, state) {
  if (!state.deliveryReservations.length) {
    elements.reservationList.innerHTML = '<p class="empty-reservations">Todavía no tienes reservas.</p>';
    return;
  }
  elements.reservationList.innerHTML = state.deliveryReservations.map((reservation) => {
    const location = reservation.deliveryCity && reservation.deliveryAddress ? `${reservation.deliveryCity} - ${reservation.deliveryAddress}` : "Retiro en tienda";
    const cost = describeDeliveryCost(reservation);
    const mapNote = hasLocation(reservation)
      ? `<small class="reservation-map-note">Ubicación marcada en el mapa${cost ? ` · Despacho: ${cost}` : ""}</small>`
      : "";
    return `<div class="reservation-item"><div><strong>${formatDate(reservation.deliveryDate)}</strong><span>${location}</span>${mapNote}</div><div class="reservation-actions"><button class="button button-secondary small edit-reservation-btn" type="button" data-delivery-date="${reservation.deliveryDate}">Editar</button><button class="button button-secondary small remove-reservation-btn" type="button" data-delivery-date="${reservation.deliveryDate}">Eliminar</button></div></div>`;
  }).join("");
}

export function renderCalendar(elements, state) {
  const monthName = state.calendarMonth.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  elements.calendarMonthLabel.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const firstDay = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth(), 1);
  const daysInMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() + 1, 0).getDate();
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const cells = Array.from({ length: firstWeekday }, () => '<span class="calendar-day calendar-day-empty" aria-hidden="true"></span>');
  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = getDateKey(new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth(), day));
    const isPast = dateKey < getTodayForCalendar();
    const isSelected = dateKey === state.selectedDeliveryDate;
    const isReserved = state.reservedDeliveryDates.includes(dateKey);
    const classes = ["calendar-day", isSelected ? "selected" : "", isReserved ? "reserved" : "", dateKey === getTodayForCalendar() ? "today" : ""].filter(Boolean).join(" ");
    cells.push(`<button class="${classes}" type="button" data-date="${dateKey}" ${isPast || isReserved ? "disabled" : ""}><span>${day}</span></button>`);
  }
  elements.calendarGrid.innerHTML = cells.join("");
  elements.previousMonthBtn.disabled = state.calendarMonth.getFullYear() === new Date().getFullYear() && state.calendarMonth.getMonth() === new Date().getMonth();
  elements.calendarGrid.querySelectorAll(".calendar-day:not(.calendar-day-empty)").forEach((button) => button.addEventListener("click", () => {
    state.selectedDeliveryDate = button.dataset.date;
    elements.deliveryDate.value = state.selectedDeliveryDate;
    updateShippingPanel(elements, state);
    renderCalendar(elements, state);
  }));
}

export function attachShippingEvents(elements, state, setStatus, onReservationSaved) {
  locationPicker = createLocationPicker(elements.shippingMap, (location) => {
    elements.shippingMapHint.textContent = location ? MAP_HINT_MARKED : MAP_HINT;
    updateShippingQuote(elements, location);
  });

  const refreshReservations = async () => {
    const dates = await getReservedDeliveryDates();
    state.reservedDeliveryDates = Array.isArray(dates) ? dates : [];
    renderCalendar(elements, state);
    renderReservationHistory(elements, state);
  };

  elements.reservationList.addEventListener("click", async (event) => {
    const button = event.target.closest(".remove-reservation-btn");
    const editButton = event.target.closest(".edit-reservation-btn");

    if (editButton) {
      const reservation = state.deliveryReservations.find((item) => item.deliveryDate === editButton.dataset.deliveryDate);
      if (!reservation) return;
      state.editingDeliveryDate = reservation.deliveryDate;
      state.selectedDeliveryDate = reservation.deliveryDate;
      elements.deliveryDate.value = reservation.deliveryDate;
      setDeliveryArea(elements, reservation.deliveryCity || "");
      elements.shippingAddress.value = reservation.deliveryAddress || "";
      selectShippingMethod(elements, state, reservation.deliveryAddress ? "home" : "pickup");
      resetAddressLookup(getGeocodeQuery(elements.shippingCity.value.trim(), elements.shippingAddress.value.trim()));
      if (hasLocation(reservation)) {
        locationPicker.setLocation({ lat: reservation.deliveryLat, lng: reservation.deliveryLng }, { center: true });
      } else {
        locationPicker.clear();
      }
      renderCalendar(elements, state);
      setStatus("Edita los datos del despacho y presiona guardar.", "info");
      return;
    }

    if (!button) return;

    try {
      const user = getCurrentUser();
      const deliveryDate = button.dataset.deliveryDate;
      const cart = await removeCartDeliveryReservation(deliveryDate, user.email);
      state.deliveryReservations = Array.isArray(cart.deliveryReservations) ? cart.deliveryReservations : [];
      if (state.savedDeliveryDate === deliveryDate) {
        state.selectedDeliveryDate = "";
        state.savedDeliveryDate = "";
        elements.deliveryDate.value = "";
        state.reservedDeliveryCity = "";
        state.reservedDeliveryAddress = "";
      }
      state.editingDeliveryDate = "";
      await refreshReservations();
      updateShippingPanel(elements, state);
      setStatus("Despacho eliminado correctamente.", "success");
    } catch (error) {
      console.error(error);
      setStatus(error.message || "No se pudo eliminar el despacho.", "error");
    }
  });

  elements.shippingPanel.querySelectorAll(".shipping-option").forEach((option) => option.addEventListener("click", () => {
    selectShippingMethod(elements, state, option.dataset.method);
  }));
  renderRegionOptions(elements);
  elements.shippingRegion.addEventListener("change", () => {
    renderCityOptions(elements, elements.shippingRegion.value);
    showRegion(elements);
  });
  elements.shippingCity.addEventListener("change", () => {
    clearTimeout(geocodeTimer);
    if (elements.shippingAddress.value.trim().length >= 3) {
      locateAddress(elements);
    } else {
      locateCity(elements);
    }
  });
  elements.shippingAddress.addEventListener("input", () => scheduleAddressLookup(elements));
  elements.shippingAddress.addEventListener("change", () => {
    clearTimeout(geocodeTimer);
    locateAddress(elements);
  });
  elements.previousMonthBtn.addEventListener("click", () => {
    if (elements.previousMonthBtn.disabled) return;
    state.calendarMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() - 1, 1);
    renderCalendar(elements, state);
  });
  elements.nextMonthBtn.addEventListener("click", () => {
    state.calendarMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() + 1, 1);
    renderCalendar(elements, state);
  });
  elements.confirmShippingBtn.addEventListener("click", async () => {
    const isPickup = state.selectedShippingMethod === "pickup";
    if (!isPickup && !elements.shippingRegion.value) {
      setStatus("Selecciona la región de despacho.", "error");
      elements.shippingRegion.focus();
      return;
    }
    if (!isPickup && !elements.shippingCity.value) {
      setStatus("Selecciona la ciudad de despacho.", "error");
      elements.shippingCity.focus();
      return;
    }
    if (!isPickup && !elements.shippingAddress.value.trim()) {
      setStatus("Ingresa una dirección para el despacho.", "error");
      elements.shippingAddress.focus();
      return;
    }
    const mapLocation = isPickup ? null : locationPicker.getLocation();
    if (!isPickup && !mapLocation) {
      setStatus("Marca en el mapa la ubicación donde se debe entregar el pedido.", "error");
      return;
    }
    if (!elements.deliveryDate.value) {
      setStatus("Selecciona un día para reservar el despacho.", "error");
      return;
    }
    const location = isPickup
      ? {}
      : {
          deliveryCity: elements.shippingCity.value,
          deliveryAddress: elements.shippingAddress.value,
          deliveryLat: mapLocation.lat,
          deliveryLng: mapLocation.lng,
        };
    try {
      const user = getCurrentUser();
      const cart = state.editingDeliveryDate
        ? await editCartDeliveryReservation(state.editingDeliveryDate, elements.deliveryDate.value, location, user.email)
        : await updateCartDeliveryDate(elements.deliveryDate.value, location, user.email);
      state.selectedDeliveryDate = cart.deliveryDate;
      state.savedDeliveryDate = state.selectedDeliveryDate;
      state.editingDeliveryDate = "";
      state.reservedDeliveryCity = cart.deliveryCity || "";
      state.reservedDeliveryAddress = cart.deliveryAddress || "";
      state.deliveryReservations = Array.isArray(cart.deliveryReservations) ? cart.deliveryReservations : state.deliveryReservations;
      setDeliveryArea(elements);
      elements.shippingAddress.value = "";
      clearDeliveryLocation();
      renderCalendar(elements, state);
      renderReservationHistory(elements, state);
      updateShippingPanel(elements, state);
      onReservationSaved(state.selectedDeliveryDate);
    } catch (error) {
      console.error(error);
      setStatus(error.message || "No se pudo reservar el día de despacho.", "error");
    }
  });
  return async () => {
    refreshMapIfVisible(elements);
    try {
      const dates = await getReservedDeliveryDates();
      state.reservedDeliveryDates = Array.isArray(dates) ? dates : [];
      renderCalendar(elements, state);
    } catch (error) {
      console.error(error);
    }
  };
}
