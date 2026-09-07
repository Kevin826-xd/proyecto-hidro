import { Router } from "express";
import { getCategories, postCategory } from "../controllers/catalog.controller";

const categoryRouter = Router();

categoryRouter.get("/", getCategories);
categoryRouter.post("/", postCategory);

export default categoryRouter;
