import { DeliveryReservation } from "../entities/cart.entity";
import { database } from "../db/connection";
import { ConflictError, NotFoundError, ValidationError } from "../errors/http-errors";
import { quoteShipping } from "./shipping.service";

export interface DeliveryLocationInput {
  deliveryCity?: string;
  deliveryAddress?: string;
  deliveryLat?: unknown;
  deliveryLng?: unknown;
}

const RESERVATION_COLUMNS = `delivery_date::text AS "deliveryDate", delivery_city AS "deliveryCity",
  delivery_address AS "deliveryAddress", delivery_lat AS "deliveryLat", delivery_lng AS "deliveryLng",
  delivery_distance_km AS "deliveryDistanceKm", delivery_cost AS "deliveryCost"`;

function validateDeliveryDate(deliveryDate: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)) {
    throw new ValidationError("La fecha de despacho debe ser válida");
  }

  const selectedDate = new Date(`${deliveryDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (Number.isNaN(selectedDate.getTime()) || selectedDate < today) {
    throw new ValidationError("La fecha de despacho no puede ser anterior a hoy");
  }
}

function isValidCoordinate(value: unknown, limit: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= limit;
}

function normalizeLocation(input: DeliveryLocationInput) {
  const city = input.deliveryCity?.trim() ?? "";
  const address = input.deliveryAddress?.trim() ?? "";

  if ((city && !address) || (!city && address)) {
    throw new ValidationError("La ciudad y la dirección deben completarse juntas");
  }

  if (!address) {
    return { city: null, address: null, lat: null, lng: null };
  }

  if (!isValidCoordinate(input.deliveryLat, 90) || !isValidCoordinate(input.deliveryLng, 180)) {
    throw new ValidationError("Debes marcar en el mapa la ubicación de entrega");
  }

  return { city, address, lat: input.deliveryLat, lng: input.deliveryLng };
}

async function prepareDelivery(input: DeliveryLocationInput) {
  const location = normalizeLocation(input);

  if (location.lat === null || location.lng === null) {
    return { ...location, distanceKm: null, cost: null };
  }

  const quote = await quoteShipping({ lat: location.lat, lng: location.lng });
  return { ...location, distanceKm: quote.distanceKm, cost: quote.cost };
}

function mapReservation(row: DeliveryReservation & { userId?: string }): DeliveryReservation & { userId?: string } {
  return {
    userId: row.userId,
    deliveryDate: row.deliveryDate,
    deliveryCity: row.deliveryCity || undefined,
    deliveryAddress: row.deliveryAddress || undefined,
    deliveryLat: row.deliveryLat ?? undefined,
    deliveryLng: row.deliveryLng ?? undefined,
    deliveryDistanceKm: row.deliveryDistanceKm ?? undefined,
    deliveryCost: row.deliveryCost ?? undefined,
  };
}

export async function listUserReservations(userEmail: string): Promise<DeliveryReservation[]> {
  const result = await database.query<DeliveryReservation>(
    `SELECT ${RESERVATION_COLUMNS}
     FROM delivery_reservations
     WHERE user_email = $1
     ORDER BY delivery_date`,
    [userEmail.trim().toLowerCase()],
  );

  return result.rows.map(mapReservation);
}

export async function listAllReservations(): Promise<Array<DeliveryReservation & { userId: string }>> {
  const result = await database.query<DeliveryReservation & { userId: string }>(
    `SELECT user_email AS "userId", ${RESERVATION_COLUMNS}
     FROM delivery_reservations
     ORDER BY delivery_date`,
  );

  return result.rows.map(mapReservation) as Array<DeliveryReservation & { userId: string }>;
}

export async function listReservedDates(): Promise<string[]> {
  const result = await database.query<{ deliveryDate: string }>(
    `SELECT delivery_date::text AS "deliveryDate"
     FROM delivery_reservations
     ORDER BY delivery_date`,
  );

  return result.rows.map((row) => row.deliveryDate);
}

export async function createReservation(
  userEmail: string,
  deliveryDate: string,
  location: DeliveryLocationInput,
): Promise<DeliveryReservation> {
  validateDeliveryDate(deliveryDate);
  const { city, address, lat, lng, distanceKm, cost } = await prepareDelivery(location);

  try {
    const result = await database.query<DeliveryReservation>(
      `INSERT INTO delivery_reservations (
         id, user_email, delivery_date, delivery_city, delivery_address, delivery_lat, delivery_lng,
         delivery_distance_km, delivery_cost, created_at, updated_at
       )
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING ${RESERVATION_COLUMNS}`,
      [userEmail.trim().toLowerCase(), deliveryDate, city, address, lat, lng, distanceKm, cost],
    );

    return mapReservation(result.rows[0]);
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new ConflictError("Ese día ya está reservado. Selecciona otra fecha disponible");
    }
    throw error;
  }
}

export async function editReservation(
  userEmail: string,
  originalDate: string,
  deliveryDate: string,
  location: DeliveryLocationInput,
): Promise<DeliveryReservation> {
  validateDeliveryDate(deliveryDate);
  const { city, address, lat, lng, distanceKm, cost } = await prepareDelivery(location);

  try {
    const result = await database.query<DeliveryReservation>(
      `UPDATE delivery_reservations
       SET delivery_date = $1, delivery_city = $2, delivery_address = $3,
           delivery_lat = $4, delivery_lng = $5, delivery_distance_km = $6, delivery_cost = $7, updated_at = NOW()
       WHERE user_email = $8 AND delivery_date = $9
      RETURNING ${RESERVATION_COLUMNS}`,
      [deliveryDate, city, address, lat, lng, distanceKm, cost, userEmail.trim().toLowerCase(), originalDate],
    );

    if (!result.rows[0]) {
      throw new NotFoundError("No se encontró el despacho seleccionado");
    }

    return mapReservation(result.rows[0]);
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new ConflictError("Ese día ya está reservado. Selecciona otra fecha disponible");
    }
    throw error;
  }
}

export async function removeReservation(userEmail: string, deliveryDate: string): Promise<void> {
  const result = await database.query(
    `DELETE FROM delivery_reservations WHERE user_email = $1 AND delivery_date = $2`,
    [userEmail.trim().toLowerCase(), deliveryDate],
  );

  if ((result.rowCount ?? 0) === 0) {
    throw new NotFoundError("No se encontró el despacho seleccionado");
  }
}
