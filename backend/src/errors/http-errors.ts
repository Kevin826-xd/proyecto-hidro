// Errores con su código HTTP. Los servicios los lanzan y el middleware de errores arma la respuesta,
// así el código de estado no depende del texto del mensaje.
export class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends HttpError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Debes iniciar sesión para realizar esta acción") {
    super(401, message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "No tienes permiso para realizar esta acción") {
    super(403, message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, message);
  }
}

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(409, message);
  }
}
