import { RequestHandler } from "express";
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

async function getCartWithReservations(userId?: string) {
  const cart = getCart(userId);
  const deliveryReservations = userId ? await listUserReservations(userId) : [];
  const lastReservation = deliveryReservations.at(-1);

  return {
    ...cart,
    deliveryDate: lastReservation?.deliveryDate,
    deliveryCity: lastReservation?.deliveryCity,
    deliveryAddress: lastReservation?.deliveryAddress,
    deliveryReservations,
  };
}

export const getCartController: RequestHandler = async (request, response) => {
  const userId = typeof request.query.userId === "string" ? request.query.userId : undefined;
  response.json(await getCartWithReservations(userId));
};

export const addItemToCartController: RequestHandler = (request, response) => {
  try {
    const userId = typeof request.query.userId === "string" ? request.query.userId : undefined;
    const { productId, name, price, quantity } = request.body ?? {};

    if (!productId || !name || typeof price !== "number" || price <= 0) {
      response.status(400).json({ message: "El id, el nombre y el precio del producto son obligatorios" });
      return;
    }

    if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0) {
      response.status(400).json({ message: "La cantidad debe ser mayor que cero" });
      return;
    }

    response.status(201).json(addItemToCart(userId, { productId, name, price }, quantity));
  } catch (error) {
    response.status(400).json({ message: (error as Error).message });
  }
};

export const updateCartItemController: RequestHandler = (request, response) => {
  try {
    const userId = typeof request.query.userId === "string" ? request.query.userId : undefined;
    const productId = Array.isArray(request.params.productId) ? request.params.productId[0] : request.params.productId;
    const { quantity } = request.body ?? {};

    if (typeof quantity !== "number" || !Number.isFinite(quantity)) {
      response.status(400).json({ message: "La cantidad debe ser un número válido" });
      return;
    }

    response.json(updateCartItemQuantity(userId, productId, quantity));
  } catch (error) {
    response.status(400).json({ message: (error as Error).message });
  }
};

export const removeCartItemController: RequestHandler = (request, response) => {
  const userId = typeof request.query.userId === "string" ? request.query.userId : undefined;
  const productId = Array.isArray(request.params.productId) ? request.params.productId[0] : request.params.productId;
  response.json(removeItemFromCart(userId, productId));
};

export const updateCartDeliveryDateController: RequestHandler = async (request, response) => {
  try {
    const userId = typeof request.query.userId === "string" ? request.query.userId : undefined;
    const { deliveryDate, deliveryCity, deliveryAddress } = request.body ?? {};

    if (typeof deliveryDate !== "string") {
      response.status(400).json({ message: "La fecha de despacho es obligatoria" });
      return;
    }

    await createReservation(userId ?? "", deliveryDate, deliveryCity, deliveryAddress);
    response.json(await getCartWithReservations(userId));
  } catch (error) {
    response.status(400).json({ message: (error as Error).message });
  }
};

export const removeCartDeliveryReservationController: RequestHandler = async (request, response) => {
  try {
    const userId = typeof request.query.userId === "string" ? request.query.userId : undefined;
    const deliveryDate = Array.isArray(request.params.deliveryDate) ? request.params.deliveryDate[0] : request.params.deliveryDate;

    if (!deliveryDate) {
      response.status(400).json({ message: "La fecha de despacho es obligatoria" });
      return;
    }

    await removeReservation(userId ?? "", deliveryDate);
    response.json(await getCartWithReservations(userId));
  } catch (error) {
    response.status(400).json({ message: (error as Error).message });
  }
};

export const editCartDeliveryReservationController: RequestHandler = async (request, response) => {
  try {
    const userId = typeof request.query.userId === "string" ? request.query.userId : undefined;
    const originalDate = Array.isArray(request.params.originalDate) ? request.params.originalDate[0] : request.params.originalDate;
    const { deliveryDate, deliveryCity, deliveryAddress } = request.body ?? {};

    if (!originalDate || typeof deliveryDate !== "string") {
      response.status(400).json({ message: "La fecha de despacho es obligatoria" });
      return;
    }

    await editReservation(userId ?? "", originalDate, deliveryDate, deliveryCity, deliveryAddress);
    response.json(await getCartWithReservations(userId));
  } catch (error) {
    response.status(400).json({ message: (error as Error).message });
  }
};

export const getReservedDeliveryDatesController: RequestHandler = async (_request, response) => {
  response.json(await listReservedDates());
};

export const getAllDeliveryReservationsController: RequestHandler = async (_request, response) => {
  response.json(await listAllReservations());
};
