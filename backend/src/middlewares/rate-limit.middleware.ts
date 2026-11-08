import { Request, RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";

const LOGIN_WINDOW_MINUTES = 15;
// Intentos fallidos permitidos para una misma cuenta desde una misma IP.
const MAX_FAILED_LOGINS_PER_ACCOUNT = 10;
// Tope general por IP, para quien pruebe muchas cuentas distintas.
const MAX_FAILED_LOGINS_PER_IP = 50;

const QUOTE_WINDOW_MINUTES = 60;
// Suficiente para una oficina que cotiza seguido; frena a quien intente llenar la base de datos.
const MAX_QUOTES_PER_WINDOW = 60;

const LOGIN_BLOCKED_MESSAGE = {
  message: `Demasiados intentos de inicio de sesión. Intenta nuevamente en ${LOGIN_WINDOW_MINUTES} minutos.`,
};

// Pedir una cotización no requiere sesión, así que se limita por IP para que nadie llene la base de datos.
// Solo cuentan las cotizaciones creadas; un formulario con errores no gasta intentos.
export const quoteRateLimit = rateLimit({
  windowMs: QUOTE_WINDOW_MINUTES * 60 * 1000,
  limit: MAX_QUOTES_PER_WINDOW,
  skipFailedRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Recibimos muchas cotizaciones desde tu conexión. Intenta nuevamente en una hora o contáctanos directamente.",
  },
});

function loginAccountKey(request: Request): string {
  const email = typeof request.body?.email === "string" ? request.body.email.trim().toLowerCase() : "";
  return `${request.ip}|${email}`;
}

// Los inicios de sesión correctos no cuentan, así un usuario que se equivoca un par de veces no queda bloqueado.
// Se cuenta por IP y por cuenta: quien intenta adivinar la contraseña de una cuenta se bloquea a los 10 fallos,
// sin bloquear el inicio de sesión de las demás cuentas que entran desde la misma red (por ejemplo, una oficina).
const loginAccountRateLimit = rateLimit({
  windowMs: LOGIN_WINDOW_MINUTES * 60 * 1000,
  limit: MAX_FAILED_LOGINS_PER_ACCOUNT,
  skipSuccessfulRequests: true,
  keyGenerator: loginAccountKey,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: LOGIN_BLOCKED_MESSAGE,
});

const loginIpRateLimit = rateLimit({
  windowMs: LOGIN_WINDOW_MINUTES * 60 * 1000,
  limit: MAX_FAILED_LOGINS_PER_IP,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: LOGIN_BLOCKED_MESSAGE,
});

// Aplica los dos límites en orden: primero el general por IP y luego el de la cuenta.
// Si alguno bloquea, responde 429 y no sigue.
export const loginRateLimit: RequestHandler = (request, response, next) => {
  loginIpRateLimit(request, response, (error?: unknown) => {
    if (error) {
      next(error);
      return;
    }
    loginAccountRateLimit(request, response, next);
  });
};
