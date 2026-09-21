import { Router } from "express";
import {
  addItemToCartController,
  getCartController,
  getReservedDeliveryDatesController,
  removeCartItemController,
  updateCartDeliveryDateController,
  updateCartItemController,
} from "../controllers/cart.controller";
import { requireUser } from "../middlewares/auth.middleware";

const cartRouter = Router();

cartRouter.get("/", requireUser, getCartController);
cartRouter.get("/reserved-dates", getReservedDeliveryDatesController);
cartRouter.post("/items", requireUser, addItemToCartController);
cartRouter.put("/items/:productId", requireUser, updateCartItemController);
cartRouter.delete("/items/:productId", requireUser, removeCartItemController);
cartRouter.put("/delivery-date", requireUser, updateCartDeliveryDateController);

export default cartRouter;
