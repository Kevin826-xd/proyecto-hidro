import { RequestHandler } from "express";
import { ApprovalDecision } from "../entities/user.entity";
import { ForbiddenError, UnauthorizedError } from "../errors/http-errors";
import { notifyAdminOfRegistration, notifyUserOfDecision } from "../services/approval.service";
import { createUser, decideUserApproval, getPendingUserByToken, loginUser } from "../services/user.service";
import { confirmDecisionPage, decisionDonePage, INVALID_LINK_PAGE } from "../templates/approval.template";
import { readParam } from "../utils/request";
import { signAccessToken } from "../utils/token";

const STATUS_MESSAGES = {
  pending: "Tu cuenta está pendiente de aprobación. Te avisaremos por correo cuando sea aprobada.",
  rejected: "Tu solicitud de registro fue rechazada.",
};

const DECISION_LABELS: Record<ApprovalDecision, { verb: string; done: string }> = {
  approve: { verb: "Aprobar", done: "aprobada" },
  reject: { verb: "Rechazar", done: "rechazada" },
};

function readDecision(value: unknown): ApprovalDecision | null {
  return value === "approve" || value === "reject" ? value : null;
}

export const registerUserController: RequestHandler = async (request, response) => {
  const body = request.body ?? {};
  const { user, approvalToken } = await createUser({
    name: typeof body.name === "string" ? body.name : "",
    email: typeof body.email === "string" ? body.email : "",
    password: typeof body.password === "string" ? body.password : "",
  });

  try {
    await notifyAdminOfRegistration(user, approvalToken);
  } catch (error) {
    console.error("No se pudo enviar el correo de aprobación al administrador", error);
  }

  response.status(201).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
    message: "Registro recibido. Un administrador revisará tu solicitud y te avisaremos por correo.",
  });
};

export const loginUserController: RequestHandler = async (request, response) => {
  const body = request.body ?? {};
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  const user = await loginUser(email, password);

  if (!user) {
    throw new UnauthorizedError("Credenciales inválidas");
  }

  if (user.status !== "approved") {
    throw new ForbiddenError(STATUS_MESSAGES[user.status]);
  }

  response.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token: signAccessToken(user),
    message: "Inicio de sesión correcto",
  });
};

// Al abrir el enlace del correo solo se muestra una confirmación. La decisión se guarda con el POST,
// así los programas que revisan los enlaces de los correos no aprueban ni rechazan por error.
export const showApprovalController: RequestHandler = async (request, response) => {
  const decision = readDecision(request.query.action);
  const token = readParam(request.params.token);
  const user = decision ? await getPendingUserByToken(token) : null;

  if (!decision || !user) {
    response.status(404).type("html").send(INVALID_LINK_PAGE);
    return;
  }

  response.type("html").send(confirmDecisionPage(user, decision, DECISION_LABELS[decision].verb));
};

export const decideApprovalController: RequestHandler = async (request, response) => {
  const decision = readDecision(request.query.action);
  const token = readParam(request.params.token);
  const user = decision ? await decideUserApproval(token, decision) : null;

  if (!decision || !user) {
    response.status(404).type("html").send(INVALID_LINK_PAGE);
    return;
  }

  try {
    await notifyUserOfDecision(user);
  } catch (error) {
    console.error("No se pudo enviar el correo con la decisión al usuario", error);
  }

  response.type("html").send(decisionDonePage(user, DECISION_LABELS[decision].done));
};
