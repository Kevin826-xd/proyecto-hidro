import { ApprovalDecision } from "../entities/user.entity";
import { escapeHtml } from "../utils/html";

// HTML de los correos y de la página que ve el administrador al aprobar o rechazar un registro.
// Todo texto que viene del usuario se escapa antes de insertarlo.

const STORE_NAME = "Servicios Hidroeléctricos Ñuble";

interface UserSummary {
  name: string;
  email: string;
}

// ---------- Correos ----------

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

export function registrationRequestEmail(user: UserSummary, approveUrl: string, rejectUrl: string): string {
  return emailLayout(`
      <h2 style="margin:0 0 12px">Nueva solicitud de registro</h2>
      <p style="margin:0 0 16px">Una persona quiere crear una cuenta en la tienda:</p>
      <p style="margin:0 0 20px"><strong>Nombre:</strong> ${escapeHtml(user.name)}<br /><strong>Email:</strong> ${escapeHtml(user.email)}</p>
      ${emailButton(approveUrl, "Aprobar", "#ffb703", "#0b1320")}
      ${emailButton(rejectUrl, "Rechazar", "#1f3a5f", "#ffffff")}
      <p style="margin:16px 0 0;color:#5a6474;font-size:13px">Al abrir un enlace te pediremos confirmar la decisión.</p>
    `);
}

export function decisionEmail(userName: string, message: string): string {
  return emailLayout(`<p style="margin:0 0 12px">Hola ${escapeHtml(userName)},</p><p style="margin:0">${message}</p>`);
}

// ---------- Página de aprobación ----------

function approvalPage(title: string, content: string): string {
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

export const INVALID_LINK_PAGE = approvalPage(
  "Enlace no válido",
  "<p>Este enlace no es válido o la solicitud ya fue aprobada o rechazada.</p>",
);

// Se muestra al abrir el enlace del correo: pide confirmar con un botón que envía el POST.
export function confirmDecisionPage(user: UserSummary, decision: ApprovalDecision, verb: string): string {
  return approvalPage(
    `${verb} solicitud de registro`,
    `<p><strong>Nombre:</strong> ${escapeHtml(user.name)}<br /><strong>Email:</strong> ${escapeHtml(user.email)}</p>
     <form method="post">
       <button class="${decision}" type="submit">${verb} solicitud</button>
     </form>`,
  );
}

export function decisionDonePage(user: UserSummary, done: string): string {
  return approvalPage(
    `Solicitud ${done}`,
    `<p>La cuenta de <strong>${escapeHtml(user.name)}</strong> (${escapeHtml(user.email)}) fue ${done}. Le enviamos un correo para avisarle.</p>`,
  );
}
