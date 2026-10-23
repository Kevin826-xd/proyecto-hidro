import { ErrorRequestHandler, RequestHandler } from "express";
import { HttpError } from "../errors/http-errors";

interface ErrorWithDetails {
  status?: number;
  type?: string;
  code?: string;
}

export const apiNotFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({ message: "Ruta no encontrada" });
};

// Único lugar donde los errores se convierten en respuestas HTTP.
// Express 5 envía aquí también los errores de los controladores async.
export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof HttpError) {
    response.status(error.status).json({ message: error.message });
    return;
  }

  const details = error as ErrorWithDetails;

  // JSON mal formado en el cuerpo de la petición.
  if (details.type === "entity.parse.failed") {
    response.status(400).json({ message: "El cuerpo de la petición no es un JSON válido" });
    return;
  }

  // PostgreSQL rechazó un dato con formato inválido (por ejemplo, una fecha o un id mal escrito).
  if (details.code?.startsWith("22")) {
    response.status(400).json({ message: "Los datos enviados no tienen un formato válido" });
    return;
  }

  console.error(error);
  response.status(500).json({ message: "Ocurrió un error inesperado. Intenta nuevamente." });
};
