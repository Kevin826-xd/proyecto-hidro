import { Router } from "express";
import {
  addItemToCartController,
  getCartController,
  getReservedDeliveryDatesController,
  removeCartItemController,
  updateCartDeliveryDateController,
  updateCartItemController,
} from "../controllers/cart.controller";

const cartRouter = Router();

cartRouter.get("/", getCartController);
cartRouter.get("/reserved-dates", getReservedDeliveryDatesController);
cartRouter.post("/items", addItemToCartController);
cartRouter.put("/items/:productId", updateCartItemController);
cartRouter.delete("/items/:productId", removeCartItemController);
cartRouter.put("/delivery-date", updateCartDeliveryDateController);

export default cartRouter;
