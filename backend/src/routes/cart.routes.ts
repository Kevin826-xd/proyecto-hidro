import { Router } from "express";
import {
  addItemToCartController,
  getCartController,
  removeCartItemController,
  updateCartItemController,
} from "../controllers/cart.controller";

const cartRouter = Router();

cartRouter.get("/", getCartController);
cartRouter.post("/items", addItemToCartController);
cartRouter.put("/items/:productId", updateCartItemController);
cartRouter.delete("/items/:productId", removeCartItemController);

export default cartRouter;
