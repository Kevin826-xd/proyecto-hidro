import { Router } from "express";
import {
  deleteProductController,
  getProductByIdController,
  getProducts,
  postProduct,
  updateProductController,
} from "../controllers/catalog.controller";
import { requireAdmin } from "../middlewares/auth.middleware";

const productRouter = Router();

productRouter.get("/", getProducts);
productRouter.get("/:id", getProductByIdController);
productRouter.post("/", postProduct);
productRouter.put("/:id", requireAdmin, updateProductController);
productRouter.delete("/:id", deleteProductController);

export default productRouter;
