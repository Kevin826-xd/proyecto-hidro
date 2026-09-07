import { Router } from "express";
import { getProducts, postProduct } from "../controllers/catalog.controller";

const productRouter = Router();

productRouter.get("/", getProducts);
productRouter.post("/", postProduct);

export default productRouter;
