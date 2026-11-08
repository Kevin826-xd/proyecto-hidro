import { Router } from "express";
import { getQuotes, postQuote } from "../controllers/quote.controller";
import { attachUserIfPresent, requireAdmin } from "../middlewares/auth.middleware";
import { quoteRateLimit } from "../middlewares/rate-limit.middleware";

const quoteRouter = Router();

// Cualquiera puede pedir una cotización; si tiene sesión, se guarda quién la pidió.
quoteRouter.post("/", quoteRateLimit, attachUserIfPresent, postQuote);
// Solo el administrador ve las cotizaciones recibidas.
quoteRouter.get("/", requireAdmin, getQuotes);

export default quoteRouter;
