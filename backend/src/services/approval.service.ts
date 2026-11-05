import { env } from "../config/env";
import { ApprovalDecision, User } from "../entities/user.entity";
import { decisionEmail, registrationRequestEmail } from "../templates/approval.template";
import { sendMail } from "./mail.service";

export function getApprovalUrl(token: string, decision: ApprovalDecision): string {
  return `${env.publicUrl}/api/users/approval/${encodeURIComponent(token)}?action=${decision}`;
}

export async function notifyAdminOfRegistration(user: User, token: string): Promise<void> {
  const approveUrl = getApprovalUrl(token, "approve");
  const rejectUrl = getApprovalUrl(token, "reject");

  await sendMail({
    to: env.adminNotifyEmail,
    subject: `Nueva solicitud de registro: ${user.name}`,
    text: [
      "Hay una nueva solicitud de registro en la tienda.",
      "",
      `Nombre: ${user.name}`,
      `Email: ${user.email}`,
      "",
      `Aprobar: ${approveUrl}`,
      `Rechazar: ${rejectUrl}`,
    ].join("\n"),
    html: registrationRequestEmail(user, approveUrl, rejectUrl),
  });
}

export async function notifyUserOfDecision(user: User): Promise<void> {
  const approved = user.status === "approved";
  const message = approved
    ? "Tu cuenta fue aprobada. Ya puedes iniciar sesión en la tienda."
    : "Tu solicitud de registro no fue aprobada. Si crees que es un error, contáctanos.";

  await sendMail({
    to: user.email,
    subject: approved ? "Tu cuenta fue aprobada" : "Tu solicitud de registro fue rechazada",
    text: `Hola ${user.name},\n\n${message}`,
    html: decisionEmail(user.name, message),
  });
}
