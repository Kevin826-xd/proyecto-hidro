import { RequestHandler } from "express";

export const corsMiddleware: RequestHandler = (_request, response, next) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  if (_request.method === "OPTIONS") {
    response.sendStatus(204);
    return;
  }

  next();
};