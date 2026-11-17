// Errores con su código HTTP. Los servicios los lanzan y el middleware de errores arma la respuesta,
// así el código de estado no depende del texto del mensaje.
// code es opcional y sirve para que el frontend reconozca un caso sin leer el texto
// (por ejemplo, EMAIL_NOT_VERIFIED para mostrar el formulario del código).
export class HttpError extends Error {
  constructor(readonly status: number, message: string, readonly code?: string) {
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
  constructor(message = "No tienes permiso para realizar esta acción", code?: string) {
    super(403, message, code);
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

export class TooManyRequestsError extends HttpError {
  constructor(message: string) {
    super(429, message);
  }
}

export class ServiceUnavailableError extends HttpError {
  constructor(message: string) {
    super(503, message);
  }
}
