export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ShippingQuote {
  distanceKm: number;
  cost: number;
  pricePerKm: number;
  byRoad: boolean;
}

const DEFAULT_PRICE_PER_KM = 700;
// Plaza de Armas de Chillán. Se reemplaza con STORE_LAT y STORE_LNG en el .env.
const DEFAULT_STORE_LOCATION: Coordinates = { lat: -36.6066, lng: -72.1034 };
const ROUTE_TIMEOUT_MS = 5000;
const EARTH_RADIUS_KM = 6371;

function readNumberEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && process.env[name]?.trim() ? value : fallback;
}

export function getPricePerKm(): number {
  return readNumberEnv("SHIPPING_PRICE_PER_KM", DEFAULT_PRICE_PER_KM);
}

export function getStoreLocation(): Coordinates {
  return {
    lat: readNumberEnv("STORE_LAT", DEFAULT_STORE_LOCATION.lat),
    lng: readNumberEnv("STORE_LNG", DEFAULT_STORE_LOCATION.lng),
  };
}

export function straightLineDistanceKm(from: Coordinates, to: Coordinates): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(deltaLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

async function roadDistanceKm(from: Coordinates, to: Coordinates): Promise<number | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(ROUTE_TIMEOUT_MS) });
    if (!response.ok) return null;

    const data = (await response.json()) as { code?: string; routes?: Array<{ distance: number }> };
    const meters = data.code === "Ok" ? data.routes?.[0]?.distance : undefined;
    return typeof meters === "number" ? meters / 1000 : null;
  } catch {
    return null;
  }
}

export function calculateShippingCost(distanceKm: number, pricePerKm: number): number {
  return Math.round(distanceKm * pricePerKm);
}

export async function quoteShipping(destination: Coordinates): Promise<ShippingQuote> {
  const origin = getStoreLocation();
  const roadKm = await roadDistanceKm(origin, destination);
  const distanceKm = Math.round((roadKm ?? straightLineDistanceKm(origin, destination)) * 10) / 10;
  const pricePerKm = getPricePerKm();

  return {
    distanceKm,
    cost: calculateShippingCost(distanceKm, pricePerKm),
    pricePerKm,
    byRoad: roadKm !== null,
  };
}
