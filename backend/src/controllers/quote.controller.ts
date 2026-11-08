import { RequestHandler } from "express";
import { getOptionalAuthUser } from "../middlewares/auth.middleware";
import { createQuote, listQuotes } from "../services/quote.service";
import { validateQuoteInput } from "../validations/quote.validation";

export const postQuote: RequestHandler = async (request, response) => {
  const user = getOptionalAuthUser(response);
  response.status(201).json(await createQuote(validateQuoteInput(request.body), user?.id ?? null));
};

export const getQuotes: RequestHandler = async (_request, response) => {
  response.json(await listQuotes());
};
