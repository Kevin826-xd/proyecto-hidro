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
productRouter.post("/", requireAdmin, postProduct);
productRouter.put("/:id", requireAdmin, updateProductController);
productRouter.delete("/:id", requireAdmin, deleteProductController);

export default productRouter;
