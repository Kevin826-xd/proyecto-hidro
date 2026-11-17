import { escapeHtml } from "../utils/html";

// HTML del correo con el código para verificar la cuenta. Todo texto que viene del usuario se escapa.

const STORE_NAME = "Servicios Hidroeléctricos Ñuble";

export function verificationCodeEmail(userName: string, code: string, validMinutes: number): string {
  return `<div style="font-family:Arial,sans-serif;background:#e3eff8;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden">
    <div style="background:#0b1320;color:#f7f5f2;padding:18px 24px;font-weight:700">${STORE_NAME}</div>
    <div style="padding:24px;color:#0b1320;line-height:1.5">
      <p style="margin:0 0 12px">Hola ${escapeHtml(userName)},</p>
      <p style="margin:0 0 16px">Ingresa este código en la tienda para verificar tu correo y activar tu cuenta:</p>
      <p style="margin:0 0 16px;font-size:32px;font-weight:700;letter-spacing:8px;text-align:center">${escapeHtml(code)}</p>
      <p style="margin:0 0 8px">El código vence en ${validMinutes} minutos.</p>
      <p style="margin:0;color:#5a6474;font-size:13px">Si no creaste una cuenta, ignora este correo.</p>
    </div>
  </div>
</div>`;
}
