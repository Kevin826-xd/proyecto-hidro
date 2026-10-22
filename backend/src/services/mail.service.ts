import nodemailer, { Transporter } from "nodemailer";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

let transporter: Transporter | null | undefined;

// Se configura con SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS y SMTP_FROM en el .env.
function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;

  const host = process.env.SMTP_HOST?.trim();
  if (!host) {
    transporter = null;
    return transporter;
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER?.trim();
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user ? { user, pass: process.env.SMTP_PASS ?? "" } : undefined,
  });
  return transporter;
}

export async function sendMail(message: MailMessage): Promise<void> {
  const mailer = getTransporter();

  if (!mailer) {
    // Sin SMTP (por ejemplo, en desarrollo) se muestra el correo en la consola para poder usar los enlaces.
    console.log(`\n[Correo no enviado: falta SMTP_HOST]\nPara: ${message.to}\nAsunto: ${message.subject}\n\n${message.text}\n`);
    return;
  }

  await mailer.sendMail({
    from: process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim(),
    ...message,
  });
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
