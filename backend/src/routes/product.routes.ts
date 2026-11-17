import { Router } from "express";
import {
  deleteProductController,
  getProductByIdController,
  getProducts,
  postProduct,
  updatePriceStockBulkController,
  updateProductController,
} from "../controllers/product.controller";
import { requireAdmin } from "../middlewares/auth.middleware";

const productRouter = Router();

productRouter.get("/", getProducts);
productRouter.get("/:id", getProductByIdController);
productRouter.post("/", requireAdmin, postProduct);
// Va antes de "/:id" para que "price-stock" no se lea como el id de un producto.
productRouter.put("/price-stock", requireAdmin, updatePriceStockBulkController);
productRouter.put("/:id", requireAdmin, updateProductController);
productRouter.delete("/:id", requireAdmin, deleteProductController);

export default productRouter;
