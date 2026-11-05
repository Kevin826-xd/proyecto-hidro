import { rateLimit } from "express-rate-limit";

const LOGIN_WINDOW_MINUTES = 15;
const MAX_FAILED_LOGINS = 10;

// Limita los intentos fallidos de inicio de sesión por IP para frenar a quien intente adivinar contraseñas.
// Los inicios de sesión correctos no cuentan, así un usuario que se equivoca un par de veces no queda bloqueado.
export const loginRateLimit = rateLimit({
  windowMs: LOGIN_WINDOW_MINUTES * 60 * 1000,
  limit: MAX_FAILED_LOGINS,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: `Demasiados intentos de inicio de sesión. Intenta nuevamente en ${LOGIN_WINDOW_MINUTES} minutos.`,
  },
});
