import { Router } from "express";
import {
  addItemToCartController,
  getCartController,
  removeCartItemController,
  updateCartItemController,
} from "../controllers/cart.controller";
import {
  editCartDeliveryReservationController,
  getAllDeliveryReservationsController,
  getReservedDeliveryDatesController,
  removeCartDeliveryReservationController,
  updateCartDeliveryDateController,
} from "../controllers/reservation.controller";
import { getShippingQuoteController } from "../controllers/shipping.controller";
import { requireAdmin, requireUser } from "../middlewares/auth.middleware";

// Las URLs se mantienen bajo /api/cart para no romper el frontend ni las pruebas,
// aunque las de despacho las atienden sus propios controladores.
const cartRouter = Router();

// Carrito
cartRouter.get("/", requireUser, getCartController);
cartRouter.post("/items", requireUser, addItemToCartController);
cartRouter.put("/items/:productId", requireUser, updateCartItemController);
cartRouter.delete("/items/:productId", requireUser, removeCartItemController);

// Costo del despacho
cartRouter.get("/shipping-quote", getShippingQuoteController);

// Reservas de despacho
cartRouter.get("/reserved-dates", getReservedDeliveryDatesController);
cartRouter.get("/admin/reservations", requireAdmin, getAllDeliveryReservationsController);
cartRouter.put("/delivery-date", requireUser, updateCartDeliveryDateController);
cartRouter.put("/delivery-date/:originalDate", requireUser, editCartDeliveryReservationController);
cartRouter.delete("/delivery-date/:deliveryDate", requireUser, removeCartDeliveryReservationController);

export default cartRouter;
