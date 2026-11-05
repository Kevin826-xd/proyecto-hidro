import { RequestHandler } from "express";
import { ValidationError } from "../errors/http-errors";
import { quoteShipping } from "../services/shipping.service";

export const getShippingQuoteController: RequestHandler = async (request, response) => {
  const lat = Number(request.query.lat);
  const lng = Number(request.query.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    throw new ValidationError("La ubicación de entrega no es válida");
  }

  response.json(await quoteShipping({ lat, lng }));
};
