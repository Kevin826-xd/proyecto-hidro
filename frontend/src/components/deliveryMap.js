import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [-36.6066, -72.1034];
const DEFAULT_ZOOM = 13;
const ADDRESS_ZOOM = 17;

const pinIcon = L.divIcon({
  className: "map-pin",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -26],
});

function createMap(container) {
  const map = L.map(container).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  return map;
}

export function hasLocation(reservation) {
  return Number.isFinite(reservation?.deliveryLat) && Number.isFinite(reservation?.deliveryLng);
}

// Nominatim permite como máximo una búsqueda por segundo.
const NOMINATIM_DELAY_MS = 1100;
const MAX_ADDRESS_ATTEMPTS = 4;

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Búsqueda cancelada", "AbortError"));
    }, { once: true });
  });
}

const MAX_SEARCH_RESULTS = 10;

async function searchPlaces(query, signal, boundingBox = null) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(MAX_SEARCH_RESULTS));
  url.searchParams.set("countrycodes", "cl");
  url.searchParams.set("q", query);
  if (boundingBox) {
    const [south, north, west, east] = boundingBox;
    url.searchParams.set("viewbox", `${west},${north},${east},${south}`);
    url.searchParams.set("bounded", "1");
  }

  const response = await fetch(url, { headers: { Accept: "application/json", "Accept-Language": "es" }, signal });
  if (!response.ok) {
    throw new Error("No se pudo buscar la dirección en el mapa.");
  }

  return response.json();
}

function normalizeName(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/’/g, "'").toLowerCase().trim();
}

// Nominatim devuelve la dirección completa separada por comas: "Calle, Comuna, Provincia, Región, Chile".
function isInPlace(result, name) {
  return result.display_name.split(",").some((part) => normalizeName(part) === normalizeName(name));
}

function toLocation(result) {
  return { lat: Number(result.lat), lng: Number(result.lon) };
}

async function findCity(city, region, signal) {
  const results = await searchPlaces(`${city}, Chile`, signal);
  const inCity = results.filter((result) => isInPlace(result, city));
  return inCity.find((result) => region && normalizeName(result.display_name).includes(normalizeName(region)))
    ?? inCity[0]
    ?? results[0]
    ?? null;
}

function cleanAddress(address) {
  return address
    .replace(/\b(depto|dpto|departamento|casa|block|torre|oficina)\b\.?\s*[\w-]*/gi, "")
    .replace(/\bcalle\b/gi, "")
    .replace(/n[°º]\s*|#/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Variantes de la dirección, de la más exacta a la más general:
// completa, cada parte separada por comas (primero las que tienen número) y solo el nombre de la calle.
export function buildAddressCandidates(address) {
  const parts = cleanAddress(address).split(",").map((part) => part.trim()).filter(Boolean);
  const withNumber = parts.filter((part) => /\d/.test(part));
  const withoutNumber = parts.filter((part) => !/\d/.test(part));
  const streetNames = withNumber.map((part) => part.replace(/\d+\s*$/, "").trim());

  return [...new Set([address.trim(), ...withNumber, ...streetNames, ...withoutNumber])]
    .filter((candidate) => candidate.length >= 3)
    .slice(0, MAX_ADDRESS_ATTEMPTS);
}

export async function geocodeCity(city, { region = "", signal } = {}) {
  const cityPlace = await findCity(city, region, signal);
  return cityPlace ? toLocation(cityPlace) : null;
}

// Primero ubica la comuna y luego busca la dirección solo dentro de ella,
// para no marcar una calle con el mismo nombre en otra comuna.
export async function geocodeAddress(city, address, { region = "", signal } = {}) {
  const cityPlace = await findCity(city, region, signal);
  const boundingBox = cityPlace?.boundingbox?.map(Number) ?? null;

  for (const candidate of buildAddressCandidates(address)) {
    await wait(NOMINATIM_DELAY_MS, signal);
    const results = await searchPlaces(`${candidate}, ${city}`, signal, boundingBox);
    const match = results.find((result) => isInPlace(result, city));
    if (match) return { ...toLocation(match), approximate: false };
  }

  return cityPlace ? { ...toLocation(cityPlace), approximate: true } : null;
}

export function createLocationPicker(container, onChange) {
  let map = null;
  let marker = null;

  function getLocation() {
    if (!marker) return null;
    const { lat, lng } = marker.getLatLng();
    return { lat, lng };
  }

  function ensureMap() {
    if (!map) {
      map = createMap(container);
      map.on("click", (event) => setLocation(event.latlng));
    }
    map.invalidateSize();
    return map;
  }

  function setLocation({ lat, lng }, { center = false } = {}) {
    const currentMap = ensureMap();

    if (marker) {
      marker.setLatLng([lat, lng]);
    } else {
      marker = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(currentMap);
      marker.on("dragend", () => onChange(getLocation()));
    }

    if (center) currentMap.setView([lat, lng], ADDRESS_ZOOM);
    onChange(getLocation());
  }

  function clear() {
    marker?.remove();
    marker = null;
    map?.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    onChange(null);
  }

  function centerOn({ lat, lng }, zoom = DEFAULT_ZOOM) {
    ensureMap().setView([lat, lng], zoom);
  }

  return { refresh: ensureMap, setLocation, getLocation, clear, centerOn };
}

export function createReservationsMap(container, buildPopup) {
  let map = null;
  let markers = null;

  function render(reservations) {
    if (!map) {
      map = createMap(container);
      markers = L.layerGroup().addTo(map);
    }
    map.invalidateSize();
    markers.clearLayers();

    const points = reservations.filter(hasLocation).map((reservation) => {
      const position = [reservation.deliveryLat, reservation.deliveryLng];
      L.marker(position, { icon: pinIcon }).bindPopup(buildPopup(reservation)).addTo(markers);
      return position;
    });

    if (points.length === 1) {
      map.setView(points[0], ADDRESS_ZOOM - 2);
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [30, 30] });
    }
  }

  return { render };
}
