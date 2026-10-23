import { RequestHandler } from "express";
import { CartWithReservations } from "../entities/cart.entity";
import { AuthUser, getAuthUser } from "../middlewares/auth.middleware";
import { ValidationError } from "../errors/http-errors";
import {
  addItemToCart,
  getCart,
  removeItemFromCart,
  updateCartItemQuantity,
} from "../services/cart.service";
import {
  createReservation,
  editReservation,
  listAllReservations,
  listReservedDates,
  listUserReservations,
  removeReservation,
} from "../services/reservation.service";
import { quoteShipping } from "../services/shipping.service";

function readParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

async function getCartWithReservations(user: AuthUser): Promise<CartWithReservations> {
  const [cart, deliveryReservations] = await Promise.all([getCart(user.id), listUserReservations(user.email)]);
  const lastReservation = deliveryReservations.at(-1);

  return {
    ...cart,
    deliveryDate: lastReservation?.deliveryDate,
    deliveryCity: lastReservation?.deliveryCity,
    deliveryAddress: lastReservation?.deliveryAddress,
    deliveryReservations,
  };
}

export const getCartController: RequestHandler = async (_request, response) => {
  response.json(await getCartWithReservations(getAuthUser(response)));
};

// Solo se recibe el producto y la cantidad. El nombre y el precio se leen de la base de datos.
export const addItemToCartController: RequestHandler = async (request, response) => {
  const { productId, quantity } = request.body ?? {};

  if (typeof productId !== "string" || !productId) {
    throw new ValidationError("El id del producto es obligatorio");
  }

  response.status(201).json(await addItemToCart(getAuthUser(response).id, productId, quantity));
};

export const updateCartItemController: RequestHandler = async (request, response) => {
  const productId = readParam(request.params.productId);
  response.json(await updateCartItemQuantity(getAuthUser(response).id, productId, request.body?.quantity));
};

export const removeCartItemController: RequestHandler = async (request, response) => {
  response.json(await removeItemFromCart(getAuthUser(response).id, readParam(request.params.productId)));
};

export const updateCartDeliveryDateController: RequestHandler = async (request, response) => {
  const user = getAuthUser(response);
  const { deliveryDate, deliveryCity, deliveryAddress, deliveryLat, deliveryLng } = request.body ?? {};

  if (typeof deliveryDate !== "string") {
    throw new ValidationError("La fecha de despacho es obligatoria");
  }

  await createReservation(user.email, deliveryDate, { deliveryCity, deliveryAddress, deliveryLat, deliveryLng });
  response.json(await getCartWithReservations(user));
};

export const removeCartDeliveryReservationController: RequestHandler = async (request, response) => {
  const user = getAuthUser(response);
  const deliveryDate = readParam(request.params.deliveryDate);

  if (!deliveryDate) {
    throw new ValidationError("La fecha de despacho es obligatoria");
  }

  await removeReservation(user.email, deliveryDate);
  response.json(await getCartWithReservations(user));
};

export const editCartDeliveryReservationController: RequestHandler = async (request, response) => {
  const user = getAuthUser(response);
  const originalDate = readParam(request.params.originalDate);
  const { deliveryDate, deliveryCity, deliveryAddress, deliveryLat, deliveryLng } = request.body ?? {};

  if (!originalDate || typeof deliveryDate !== "string") {
    throw new ValidationError("La fecha de despacho es obligatoria");
  }

  await editReservation(user.email, originalDate, deliveryDate, { deliveryCity, deliveryAddress, deliveryLat, deliveryLng });
  response.json(await getCartWithReservations(user));
};

export const getShippingQuoteController: RequestHandler = async (request, response) => {
  const lat = Number(request.query.lat);
  const lng = Number(request.query.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    throw new ValidationError("La ubicación de entrega no es válida");
  }

  response.json(await quoteShipping({ lat, lng }));
};

export const getReservedDeliveryDatesController: RequestHandler = async (_request, response) => {
  response.json(await listReservedDates());
};

export const getAllDeliveryReservationsController: RequestHandler = async (_request, response) => {
  response.json(await listAllReservations());
};
