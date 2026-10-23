import { Router } from "express";
import { getCategories, postCategory } from "../controllers/catalog.controller";
import { requireAdmin } from "../middlewares/auth.middleware";

const categoryRouter = Router();

categoryRouter.get("/", getCategories);
categoryRouter.post("/", requireAdmin, postCategory);

export default categoryRouter;
