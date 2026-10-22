import { ApprovalDecision, User } from "../entities/user.entity";
import { escapeHtml, sendMail } from "./mail.service";

const STORE_NAME = "Servicios Hidroeléctricos Ñuble";

// Dirección pública del backend, usada en los enlaces del correo (por ejemplo https://api.midominio.cl).
function getPublicUrl(): string {
  const configured = process.env.PUBLIC_URL?.trim().replace(/\/+$/, "");
  return configured || `http://localhost:${process.env.PORT ?? 3000}`;
}

const DEFAULT_NOTIFICATION_EMAIL = "hidroelectricos.center@gmail.com";

// Las solicitudes de registro llegan a este correo. Se puede cambiar con ADMIN_NOTIFY_EMAIL en el .env.
function getAdminNotificationEmail(): string {
  return process.env.ADMIN_NOTIFY_EMAIL?.trim() || DEFAULT_NOTIFICATION_EMAIL;
}

export function getApprovalUrl(token: string, decision: ApprovalDecision): string {
  return `${getPublicUrl()}/api/users/approval/${encodeURIComponent(token)}?action=${decision}`;
}

function emailButton(url: string, label: string, background: string, color: string): string {
  return `<a href="${escapeHtml(url)}" style="display:inline-block;margin:0 8px 8px 0;padding:12px 22px;border-radius:10px;background:${background};color:${color};font-weight:700;text-decoration:none">${label}</a>`;
}

function emailLayout(content: string): string {
  return `<div style="font-family:Arial,sans-serif;background:#e3eff8;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden">
    <div style="background:#0b1320;color:#f7f5f2;padding:18px 24px;font-weight:700">${STORE_NAME}</div>
    <div style="padding:24px;color:#0b1320;line-height:1.5">${content}</div>
  </div>
</div>`;
}

export async function notifyAdminOfRegistration(user: User, token: string): Promise<void> {
  const approveUrl = getApprovalUrl(token, "approve");
  const rejectUrl = getApprovalUrl(token, "reject");
  const name = escapeHtml(user.name);
  const email = escapeHtml(user.email);

  await sendMail({
    to: getAdminNotificationEmail(),
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
    html: emailLayout(`
      <h2 style="margin:0 0 12px">Nueva solicitud de registro</h2>
      <p style="margin:0 0 16px">Una persona quiere crear una cuenta en la tienda:</p>
      <p style="margin:0 0 20px"><strong>Nombre:</strong> ${name}<br /><strong>Email:</strong> ${email}</p>
      ${emailButton(approveUrl, "Aprobar", "#ffb703", "#0b1320")}
      ${emailButton(rejectUrl, "Rechazar", "#1f3a5f", "#ffffff")}
      <p style="margin:16px 0 0;color:#5a6474;font-size:13px">Al abrir un enlace te pediremos confirmar la decisión.</p>
    `),
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
    html: emailLayout(`<p style="margin:0 0 12px">Hola ${escapeHtml(user.name)},</p><p style="margin:0">${message}</p>`),
  });
}

// Página HTML que ve el administrador al abrir el enlace del correo.
export function renderApprovalPage(title: string, content: string): string {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px; background: #e3eff8; color: #0b1320; font-family: Arial, sans-serif; }
    .card { width: 100%; max-width: 460px; overflow: hidden; border-radius: 16px; background: #ffffff; box-shadow: 0 20px 45px rgba(11, 19, 32, 0.08); }
    .card-header { padding: 18px 24px; background: #0b1320; color: #f7f5f2; font-weight: 700; }
    .card-body { padding: 24px; line-height: 1.5; }
    h1 { margin: 0 0 12px; font-size: 1.4rem; }
    p { margin: 0 0 16px; }
    button { border: none; border-radius: 12px; padding: 12px 22px; font-size: 1rem; font-weight: 700; cursor: pointer; }
    .approve { background: #ffb703; color: #0b1320; }
    .reject { background: #b42318; color: #ffffff; }
  </style>
</head>
<body>
  <main class="card">
    <div class="card-header">${STORE_NAME}</div>
    <div class="card-body"><h1>${escapeHtml(title)}</h1>${content}</div>
  </main>
</body>
</html>`;
}
