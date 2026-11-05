import { CHILE_REGIONS, findRegionByCity, getCitiesByRegion, getRegionCenter } from "../config/chileRegions";
import type { AppElements } from "../elements";
import { getShippingQuote } from "../services/cartService";
import type { Coordinates } from "../types/api";
import { formatDistance, formatPrice, isAbortError } from "../utils/formatters";
import { createLocationPicker, geocodeAddress, geocodeCity, type LocationPicker } from "./deliveryMap";

// Ubicación de entrega: región, ciudad, dirección y el pin en el mapa, junto con el costo estimado del despacho.

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

let locationPicker: LocationPicker | null = null;
let geocodeTimer: ReturnType<typeof setTimeout> | undefined;
let geocodeController: AbortController | null = null;
let lastGeocodeQuery = "";
let quoteTimer: ReturnType<typeof setTimeout> | undefined;
let quoteController: AbortController | null = null;

// El mapa se crea en attachLocationEvents; usarlo antes es un error de programación.
function picker(): LocationPicker {
  if (!locationPicker) {
    throw new Error("El mapa de despacho todavía no se ha creado (falta llamar a attachLocationEvents).");
  }
  return locationPicker;
}

// ---------- Costo del despacho ----------

function showQuote(elements: AppElements, text: string): void {
  elements.shippingQuote.textContent = text;
  elements.shippingQuote.classList.toggle("hidden", !text);
}

function updateShippingQuote(elements: AppElements, location: Coordinates | null): void {
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
      if (isAbortError(error)) return;
      console.error(error);
      showQuote(elements, "No se pudo calcular el costo. Se calculará al reservar.");
    }
  }, QUOTE_DELAY_MS);
}

// ---------- Región y ciudad ----------

function renderOptions(select: HTMLSelectElement, placeholder: string, values: string[]): void {
  select.innerHTML = [placeholder, ...values]
    .map((value, index) => `<option value="${index ? value : ""}">${value}</option>`)
    .join("");
}

function renderCityOptions(elements: AppElements, region: string): void {
  const cities = [...getCitiesByRegion(region)].sort((a, b) => a.localeCompare(b, "es"));
  renderOptions(elements.shippingCity, region ? "Selecciona una ciudad" : "Primero selecciona una región", cities);
  elements.shippingCity.disabled = !region;
}

function renderRegionOptions(elements: AppElements): void {
  if (elements.shippingRegion.options.length > 1) return;
  renderOptions(elements.shippingRegion, "Selecciona una región", CHILE_REGIONS.map((region) => region.name));
}

// Selecciona la región y la ciudad a partir del nombre de la ciudad. Sin ciudad, deja ambas sin elegir.
export function setDeliveryArea(elements: AppElements, city = ""): void {
  renderRegionOptions(elements);
  const region = findRegionByCity(city);
  elements.shippingRegion.value = region;
  renderCityOptions(elements, region);
  elements.shippingCity.value = getCitiesByRegion(region).find((item) => item.toLowerCase() === city.trim().toLowerCase()) ?? "";
}

// ---------- Búsqueda en el mapa ----------

function getGeocodeQuery(city: string, address: string): string {
  return `${city}|${address}`.toLowerCase();
}

function cancelAddressLookup(): void {
  clearTimeout(geocodeTimer);
  geocodeController?.abort();
  geocodeController = null;
}

function resetAddressLookup(query = ""): void {
  cancelAddressLookup();
  lastGeocodeQuery = query;
}

async function locateAddress(elements: AppElements): Promise<void> {
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
      picker().clear();
      elements.shippingMapHint.textContent = MAP_HINT_NOT_FOUND;
    } else if (location.approximate) {
      picker().clear();
      picker().centerOn(location, CITY_ZOOM);
      elements.shippingMapHint.textContent = MAP_HINT_APPROXIMATE;
    } else {
      picker().setLocation(location, { center: true });
    }
  } catch (error) {
    if (isAbortError(error)) return;
    console.error(error);
    lastGeocodeQuery = "";
    elements.shippingMapHint.textContent = MAP_HINT_ERROR;
  } finally {
    if (geocodeController === controller) geocodeController = null;
  }
}

function showRegion(elements: AppElements): void {
  cancelAddressLookup();
  lastGeocodeQuery = "";
  picker().clear();
  const center = getRegionCenter(elements.shippingRegion.value);
  if (center) {
    picker().centerOn(center, center.zoom);
    elements.shippingMapHint.textContent = MAP_HINT_REGION;
  }
}

// Centra el mapa en la ciudad elegida, sin necesitar la dirección.
async function locateCity(elements: AppElements): Promise<void> {
  const city = elements.shippingCity.value;
  if (!city) {
    showRegion(elements);
    return;
  }

  cancelAddressLookup();
  lastGeocodeQuery = "";
  picker().clear();
  const controller = new AbortController();
  geocodeController = controller;
  elements.shippingMapHint.textContent = MAP_HINT_SEARCHING_CITY;

  try {
    const location = await geocodeCity(city, { region: elements.shippingRegion.value, signal: controller.signal });
    if (location) picker().centerOn(location, CITY_ZOOM);
    elements.shippingMapHint.textContent = location ? MAP_HINT_CITY : MAP_HINT_CITY_NOT_FOUND;
  } catch (error) {
    if (isAbortError(error)) return;
    console.error(error);
    elements.shippingMapHint.textContent = MAP_HINT_CITY_NOT_FOUND;
  } finally {
    if (geocodeController === controller) geocodeController = null;
  }
}

function scheduleAddressLookup(elements: AppElements): void {
  clearTimeout(geocodeTimer);
  geocodeTimer = setTimeout(() => locateAddress(elements), GEOCODE_DELAY_MS);
}

// ---------- Uso desde el formulario de despacho ----------

// El mapa no se dibuja bien si estaba oculto; se recalcula al mostrar el panel.
export function refreshMapIfVisible(elements: AppElements): void {
  if (locationPicker && elements.shippingMap.offsetParent !== null) {
    locationPicker.refresh();
  }
}

export function clearDeliveryLocation(): void {
  resetAddressLookup();
  locationPicker?.clear();
}

// Ubicación marcada con el pin, o null si no hay ninguna.
export function getMarkedLocation(): Coordinates | null {
  return picker().getLocation();
}

// Llena ciudad, dirección y pin (por ejemplo, al editar una reserva) sin volver a buscar la dirección en el mapa.
export function fillDeliveryLocation(elements: AppElements, { city = "", address = "", location = null }: { city?: string; address?: string; location?: Coordinates | null }): void {
  setDeliveryArea(elements, city);
  elements.shippingAddress.value = address;
  resetAddressLookup(getGeocodeQuery(elements.shippingCity.value.trim(), address.trim()));
  if (location) {
    picker().setLocation(location, { center: true });
  } else {
    picker().clear();
  }
}

export function attachLocationEvents(elements: AppElements): void {
  locationPicker = createLocationPicker(elements.shippingMap, (location) => {
    elements.shippingMapHint.textContent = location ? MAP_HINT_MARKED : MAP_HINT;
    updateShippingQuote(elements, location);
  });

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
}
