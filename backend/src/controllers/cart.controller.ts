import { RequestHandler } from "express";
import {
  addItemToCart,
  getCart,
  removeItemFromCart,
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
      response.status(400).json({ message: "Product id, name and price are required" });
      return;
    }

    if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0) {
      response.status(400).json({ message: "Quantity must be greater than zero" });
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
      response.status(400).json({ message: "Quantity must be a valid number" });
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
