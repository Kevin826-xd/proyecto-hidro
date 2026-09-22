import { RequestHandler } from "express";
import { getUserByEmail } from "../services/user.service";

export const requireUser: RequestHandler = (request, response, next) => {
  const userId = typeof request.query.userId === "string" ? request.query.userId.trim() : "";

  if (!userId) {
    response.status(401).json({ message: "Debes iniciar sesión para realizar esta acción" });
    return;
  }

  next();
};

export const requireAdmin: RequestHandler = async (request, response, next) => {
  const userId = typeof request.query.userId === "string" ? request.query.userId.trim() : "";

  if (!userId) {
    response.status(401).json({ message: "Debes iniciar sesión para realizar esta acción" });
    return;
  }

  const user = await getUserByEmail(userId);
  if (!user || user.role !== "admin") {
    response.status(403).json({ message: "Solo un administrador puede realizar esta acción" });
    return;
  }

  next();
};