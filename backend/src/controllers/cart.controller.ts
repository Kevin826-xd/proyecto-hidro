import { RequestHandler } from "express";
import { getAuthUser } from "../middlewares/auth.middleware";
import { ValidationError } from "../errors/http-errors";
import { addItemToCart, getCartWithReservations, removeItemFromCart, updateCartItemQuantity } from "../services/cart.service";
import { readParam } from "../utils/request";

export const getCartController: RequestHandler = async (_request, response) => {
  const user = getAuthUser(response);
  response.json(await getCartWithReservations(user.id, user.email));
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
