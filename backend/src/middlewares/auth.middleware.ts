import { RequestHandler, Response } from "express";
import { User } from "../entities/user.entity";
import { ForbiddenError, UnauthorizedError } from "../errors/http-errors";
import { getUserById } from "../services/user.service";
import { verifyAccessToken } from "../utils/token";

export type AuthUser = Pick<User, "id" | "name" | "email" | "role">;

function readBearerToken(header: string | undefined): string {
  const [scheme, token] = header?.split(" ") ?? [];
  return scheme === "Bearer" && token ? token : "";
}

// El usuario viene del token firmado, no de datos que el navegador pueda cambiar.
// Además se busca en la base de datos para que una cuenta eliminada o no aprobada deje de funcionar.
async function authenticate(header: string | undefined): Promise<AuthUser> {
  const payload = verifyAccessToken(readBearerToken(header));
  const user = payload ? await getUserById(payload.sub) : null;

  if (!user || user.status !== "approved") {
    throw new UnauthorizedError();
  }

  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export function getAuthUser(response: Response): AuthUser {
  return response.locals.authUser as AuthUser;
}

export const requireUser: RequestHandler = async (request, response, next) => {
  response.locals.authUser = await authenticate(request.headers.authorization);
  next();
};

export const requireAdmin: RequestHandler = async (request, response, next) => {
  const user = await authenticate(request.headers.authorization);

  if (user.role !== "admin") {
    throw new ForbiddenError("Solo un administrador puede realizar esta acción");
  }

  response.locals.authUser = user;
  next();
};
