import { RequestHandler } from "express";
import { User } from "../entities/user.entity";
import { ForbiddenError, HttpError, UnauthorizedError } from "../errors/http-errors";
import { getUserById, loginUser, registerUser } from "../services/user.service";
import {
  resendVerificationCode,
  sendVerificationCode,
  VERIFICATION_CODE_LENGTH,
  verifyEmailCode,
} from "../services/verification.service";
import { signAccessToken } from "../utils/token";

// El frontend reconoce este código para mostrar el formulario donde se ingresa el código del correo.
export const EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED";

const NOT_VERIFIED_MESSAGE =
  "Tu cuenta aún no está verificada. Ingresa el código que te enviamos por correo. Si no lo tienes o expiró, pide uno nuevo.";

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

// Respuesta al iniciar sesión y al verificar la cuenta: los datos del usuario y su token.
function sessionResponse(user: User, message: string) {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token: signAccessToken(user),
    message,
  };
}

export const registerUserController: RequestHandler = async (request, response) => {
  const body = request.body ?? {};
  const user = await registerUser({
    name: readString(body.name),
    email: readString(body.email),
    password: readString(body.password),
  });

  // La cuenta ya quedó creada: si el correo falla, la persona puede pedir otro código desde la interfaz.
  let codeSent = true;
  try {
    await sendVerificationCode(user);
  } catch (error) {
    if (!(error instanceof HttpError)) throw error;
    codeSent = false;
  }

  response.status(201).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
    codeSent,
    message: codeSent
      ? `Te enviamos un código de ${VERIFICATION_CODE_LENGTH} dígitos a ${user.email}. Ingrésalo para activar tu cuenta.`
      : "Tu cuenta quedó creada, pero no pudimos enviarte el código. Presiona \"Reenviar código\" en unos minutos.",
  });
};

export const loginUserController: RequestHandler = async (request, response) => {
  const body = request.body ?? {};
  const user = await loginUser(readString(body.email), readString(body.password));

  if (!user) {
    throw new UnauthorizedError("Credenciales inválidas");
  }

  // Solo llega aquí quien escribió la contraseña correcta, así que se le puede decir que falta verificar.
  if (user.status !== "verified") {
    throw new ForbiddenError(NOT_VERIFIED_MESSAGE, EMAIL_NOT_VERIFIED);
  }

  response.json(sessionResponse(user, "Inicio de sesión correcto"));
};

// Con el código correcto la cuenta queda verificada y la sesión se inicia de inmediato.
export const verifyEmailController: RequestHandler = async (request, response) => {
  const body = request.body ?? {};
  const userId = await verifyEmailCode(readString(body.email), readString(body.password), readString(body.code));
  const user = (await getUserById(userId)) as User;

  response.json(sessionResponse(user, "Tu cuenta quedó verificada. ¡Bienvenido!"));
};

export const resendCodeController: RequestHandler = async (request, response) => {
  await resendVerificationCode(readString(request.body?.email));

  response.json({ message: "Si la cuenta está pendiente de verificación, te enviamos un código nuevo a tu correo." });
};
