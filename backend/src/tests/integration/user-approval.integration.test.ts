import crypto from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { database } from "../../utils/database";
import { api } from "./helpers/api";

const API_URL = process.env.API_URL ?? "http://localhost:3000";
const testId = Date.now();
const approvedEmail = `aprobacion-${testId}@hidrocenter.test`;
const rejectedEmail = `rechazo-${testId}@hidrocenter.test`;
const password = "secreto123";

// El token real solo viaja por correo, así que la prueba guarda uno conocido en la base de datos.
async function setApprovalToken(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await database.query("UPDATE users SET approval_token_hash = $1 WHERE email = $2", [tokenHash, email]);
  return token;
}

function approvalUrl(token: string, action: string) {
  return `${API_URL}/api/users/approval/${token}?action=${action}`;
}

function login(email: string) {
  return api("POST", "/api/users/login", { email, password });
}

beforeAll(async () => {
  for (const email of [approvedEmail, rejectedEmail]) {
    await api("POST", "/api/users/register", { name: "Cliente Aprobación", email, password });
  }
});

afterAll(async () => {
  await database.query("DELETE FROM users WHERE email = ANY($1)", [[approvedEmail, rejectedEmail]]);
  await database.end();
});

describe("Registro con aprobación previa", () => {
  it("no permite iniciar sesión mientras la cuenta está pendiente", async () => {
    const result = await login(approvedEmail);

    expect(result.status).toBe(403);
    expect(result.body.message).toContain("pendiente de aprobación");
  });

  it("abrir el enlace solo pide confirmación y no aprueba la cuenta", async () => {
    const token = await setApprovalToken(approvedEmail);

    const page = await fetch(approvalUrl(token, "approve"));

    expect(page.status).toBe(200);
    expect(await page.text()).toContain("Aprobar solicitud");
    expect((await login(approvedEmail)).status).toBe(403);
  });

  it("aprueba la cuenta al confirmar y el enlace no se puede reutilizar", async () => {
    const token = await setApprovalToken(approvedEmail);

    const decision = await fetch(approvalUrl(token, "approve"), { method: "POST" });
    const reused = await fetch(approvalUrl(token, "approve"), { method: "POST" });

    expect(decision.status).toBe(200);
    expect((await login(approvedEmail)).status).toBe(200);
    expect(reused.status).toBe(404);
  });

  it("rechaza la cuenta y muestra el motivo al iniciar sesión", async () => {
    const token = await setApprovalToken(rejectedEmail);

    const decision = await fetch(approvalUrl(token, "reject"), { method: "POST" });
    const result = await login(rejectedEmail);

    expect(decision.status).toBe(200);
    expect(result.status).toBe(403);
    expect(result.body.message).toContain("rechazada");
  });

  it("responde 404 si la acción del enlace no es válida", async () => {
    const page = await fetch(approvalUrl("token-inexistente", "borrar"));

    expect(page.status).toBe(404);
  });
});
