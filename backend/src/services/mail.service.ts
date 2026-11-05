import nodemailer, { Transporter } from "nodemailer";
import { env } from "../config/env";

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

  const { host, port, user, pass } = env.smtp;
  if (!host) {
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user ? { user, pass } : undefined,
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
    from: env.smtp.from,
    ...message,
  });
}
