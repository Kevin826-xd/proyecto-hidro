import { RequestHandler } from "express";

export const requireUser: RequestHandler = (request, response, next) => {
  const userId = typeof request.query.userId === "string" ? request.query.userId.trim() : "";

  if (!userId) {
    response.status(401).json({ message: "Debes iniciar sesión para realizar esta acción" });
    return;
  }

  next();
};