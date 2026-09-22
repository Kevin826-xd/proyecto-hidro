import { DeliveryReservation } from "../entities/cart.entity";
import { database } from "../utils/database";

function validateDeliveryDate(deliveryDate: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)) {
    throw new Error("La fecha de despacho debe ser válida");
  }

  const selectedDate = new Date(`${deliveryDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (Number.isNaN(selectedDate.getTime()) || selectedDate < today) {
    throw new Error("La fecha de despacho no puede ser anterior a hoy");
  }
}

function normalizeLocation(deliveryCity?: string, deliveryAddress?: string) {
  const city = deliveryCity?.trim() ?? "";
  const address = deliveryAddress?.trim() ?? "";

  if ((city && !address) || (!city && address)) {
    throw new Error("La ciudad y la dirección deben completarse juntas");
  }

  return { city: city || null, address: address || null };
}

function mapReservation(row: DeliveryReservation & { userId?: string }): DeliveryReservation & { userId?: string } {
  return {
    userId: row.userId,
    deliveryDate: row.deliveryDate,
    deliveryCity: row.deliveryCity || undefined,
    deliveryAddress: row.deliveryAddress || undefined,
  };
}

export async function listUserReservations(userEmail: string): Promise<DeliveryReservation[]> {
  const result = await database.query<DeliveryReservation>(
    `SELECT delivery_date::text AS "deliveryDate", delivery_city AS "deliveryCity", delivery_address AS "deliveryAddress"
     FROM delivery_reservations
     WHERE user_email = $1
     ORDER BY delivery_date`,
    [userEmail.trim().toLowerCase()],
  );

  return result.rows.map(mapReservation);
}

export async function listAllReservations(): Promise<Array<DeliveryReservation & { userId: string }>> {
  const result = await database.query<DeliveryReservation & { userId: string }>(
    `SELECT user_email AS "userId", delivery_date::text AS "deliveryDate", delivery_city AS "deliveryCity", delivery_address AS "deliveryAddress"
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
  deliveryCity?: string,
  deliveryAddress?: string,
): Promise<DeliveryReservation> {
  validateDeliveryDate(deliveryDate);
  const { city, address } = normalizeLocation(deliveryCity, deliveryAddress);

  try {
    const result = await database.query<DeliveryReservation>(
      `INSERT INTO delivery_reservations (id, user_email, delivery_date, delivery_city, delivery_address, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
      RETURNING delivery_date::text AS "deliveryDate", delivery_city AS "deliveryCity", delivery_address AS "deliveryAddress"`,
      [userEmail.trim().toLowerCase(), deliveryDate, city, address],
    );

    return mapReservation(result.rows[0]);
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new Error("Ese día ya está reservado. Selecciona otra fecha disponible");
    }
    throw error;
  }
}

export async function editReservation(
  userEmail: string,
  originalDate: string,
  deliveryDate: string,
  deliveryCity?: string,
  deliveryAddress?: string,
): Promise<DeliveryReservation> {
  validateDeliveryDate(deliveryDate);
  const { city, address } = normalizeLocation(deliveryCity, deliveryAddress);

  try {
    const result = await database.query<DeliveryReservation>(
      `UPDATE delivery_reservations
       SET delivery_date = $1, delivery_city = $2, delivery_address = $3, updated_at = NOW()
       WHERE user_email = $4 AND delivery_date = $5
      RETURNING delivery_date::text AS "deliveryDate", delivery_city AS "deliveryCity", delivery_address AS "deliveryAddress"`,
      [deliveryDate, city, address, userEmail.trim().toLowerCase(), originalDate],
    );

    if (!result.rows[0]) {
      throw new Error("No se encontró el despacho seleccionado");
    }

    return mapReservation(result.rows[0]);
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new Error("Ese día ya está reservado. Selecciona otra fecha disponible");
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
    throw new Error("No se encontró el despacho seleccionado");
  }
}
