import { Router } from "express";
import {
  addItemToCartController,
  editCartDeliveryReservationController,
  getCartController,
  getAllDeliveryReservationsController,
  getReservedDeliveryDatesController,
  removeCartItemController,
  removeCartDeliveryReservationController,
  updateCartDeliveryDateController,
  updateCartItemController,
} from "../controllers/cart.controller";
import { requireAdmin, requireUser } from "../middlewares/auth.middleware";

const cartRouter = Router();

cartRouter.get("/", requireUser, getCartController);
cartRouter.get("/reserved-dates", getReservedDeliveryDatesController);
cartRouter.get("/admin/reservations", requireAdmin, getAllDeliveryReservationsController);
cartRouter.post("/items", requireUser, addItemToCartController);
cartRouter.put("/items/:productId", requireUser, updateCartItemController);
cartRouter.delete("/items/:productId", requireUser, removeCartItemController);
cartRouter.put("/delivery-date", requireUser, updateCartDeliveryDateController);
cartRouter.put("/delivery-date/:originalDate", requireUser, editCartDeliveryReservationController);
cartRouter.delete("/delivery-date/:deliveryDate", requireUser, removeCartDeliveryReservationController);

export default cartRouter;
