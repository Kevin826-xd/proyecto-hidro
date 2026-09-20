import { RequestHandler } from "express";
import {
  addItemToCart,
  getCart,
  getReservedDeliveryDates,
  removeItemFromCart,
  updateCartDeliveryDate,
  updateCartItemQuantity,
} from "../services/cart.service";

export const getCartController: RequestHandler = (request, response) => {
  const userId = typeof request.query.userId === "string" ? request.query.userId : undefined;
  response.json(getCart(userId));
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

export const updateCartDeliveryDateController: RequestHandler = (request, response) => {
  try {
    const userId = typeof request.query.userId === "string" ? request.query.userId : undefined;
    const { deliveryDate, deliveryCity, deliveryAddress } = request.body ?? {};

    if (typeof deliveryDate !== "string") {
      response.status(400).json({ message: "La fecha de despacho es obligatoria" });
      return;
    }

    response.json(updateCartDeliveryDate(userId, deliveryDate, deliveryCity, deliveryAddress));
  } catch (error) {
    response.status(400).json({ message: (error as Error).message });
  }
};

export const getReservedDeliveryDatesController: RequestHandler = (_request, response) => {
  response.json(getReservedDeliveryDates());
};
