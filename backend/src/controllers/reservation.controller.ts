import { RequestHandler } from "express";
import { getAuthUser } from "../middlewares/auth.middleware";
import { ValidationError } from "../errors/http-errors";
import { getCartWithReservations } from "../services/cart.service";
import {
  createReservation,
  editReservation,
  listAllReservations,
  listReservedDates,
  removeReservation,
} from "../services/reservation.service";
import { readParam } from "../utils/request";

// Reservar, editar o quitar un despacho responde con el carrito actualizado, igual que antes de separar este archivo.

export const updateCartDeliveryDateController: RequestHandler = async (request, response) => {
  const user = getAuthUser(response);
  const { deliveryDate, deliveryCity, deliveryAddress, deliveryLat, deliveryLng } = request.body ?? {};

  if (typeof deliveryDate !== "string") {
    throw new ValidationError("La fecha de despacho es obligatoria");
  }

  await createReservation(user.email, deliveryDate, { deliveryCity, deliveryAddress, deliveryLat, deliveryLng });
  response.json(await getCartWithReservations(user.id, user.email));
};

export const removeCartDeliveryReservationController: RequestHandler = async (request, response) => {
  const user = getAuthUser(response);
  const deliveryDate = readParam(request.params.deliveryDate);

  if (!deliveryDate) {
    throw new ValidationError("La fecha de despacho es obligatoria");
  }

  await removeReservation(user.email, deliveryDate);
  response.json(await getCartWithReservations(user.id, user.email));
};

export const editCartDeliveryReservationController: RequestHandler = async (request, response) => {
  const user = getAuthUser(response);
  const originalDate = readParam(request.params.originalDate);
  const { deliveryDate, deliveryCity, deliveryAddress, deliveryLat, deliveryLng } = request.body ?? {};

  if (!originalDate || typeof deliveryDate !== "string") {
    throw new ValidationError("La fecha de despacho es obligatoria");
  }

  await editReservation(user.email, originalDate, deliveryDate, { deliveryCity, deliveryAddress, deliveryLat, deliveryLng });
  response.json(await getCartWithReservations(user.id, user.email));
};

export const getReservedDeliveryDatesController: RequestHandler = async (_request, response) => {
  response.json(await listReservedDates());
};

export const getAllDeliveryReservationsController: RequestHandler = async (_request, response) => {
  response.json(await listAllReservations());
};
