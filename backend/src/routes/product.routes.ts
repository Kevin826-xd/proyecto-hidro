import { Router } from "express";
import {
  deleteProductController,
  getProductByIdController,
  getProducts,
  postProduct,
  updateProductController,
} from "../controllers/catalog.controller";

const productRouter = Router();

productRouter.get("/", getProducts);
productRouter.get("/:id", getProductByIdController);
productRouter.post("/", postProduct);
productRouter.put("/:id", updateProductController);
productRouter.delete("/:id", deleteProductController);

export default productRouter;
