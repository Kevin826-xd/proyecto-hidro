import { afterAll, describe, expect, it } from "vitest";
import { database } from "../../db/connection";
import { api, setVerificationCode } from "./helpers/api";

// Registro con verificación del correo: la persona recibe un código de 6 dígitos y lo ingresa para activar su cuenta.
const testId = Date.now();
const email = `verificacion-${testId}@hidrocenter.test`;
const lockedEmail = `verificacion-bloqueo-${testId}@hidrocenter.test`;
const resendEmail = `verificacion-reenvio-${testId}@hidrocenter.test`;
const password = "secreto123";
const knownCode = "123456";
const wrongCode = "654321";

function register(userEmail: string, userPassword = password) {
  return api("POST", "/api/users/register", { name: "Cliente Verificación", email: userEmail, password: userPassword });
}

function login(userEmail: string, userPassword = password) {
  return api("POST", "/api/users/login", { email: userEmail, password: userPassword });
}

function verify(userEmail: string, code: string, userPassword = password) {
  return api("POST", "/api/users/verify", { email: userEmail, password: userPassword, code });
}

// El código se envió "hace" esa cantidad de segundos (para probar la espera entre reenvíos).
function setCodeSentSecondsAgo(userEmail: string, seconds: number) {
  return database.query(
    "UPDATE users SET verification_code_sent_at = NOW() - make_interval(secs => $2::int) WHERE email = $1",
    [userEmail, seconds],
  );
}

afterAll(async () => {
  await database.query("DELETE FROM users WHERE email = ANY($1)", [[email, lockedEmail, resendEmail]]);
  await database.end();
});

describe("Registro con verificación por código", () => {
  it("el registro deja la cuenta pendiente y pide el código al iniciar sesión", async () => {
    const registered = await register(email);
    const result = await login(email);

    expect(registered.status).toBe(201);
    expect(registered.body.user.status).toBe("pending");
    expect(result.status).toBe(403);
    expect(result.body.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("con una contraseña incorrecta no revela que la cuenta está pendiente", async () => {
    const result = await login(email, "otra-clave");

    expect(result.status).toBe(401);
    expect(result.body.code).toBeUndefined();
  });

  it("rechaza un código incorrecto e informa los intentos que quedan", async () => {
    await setVerificationCode(email, knownCode);

    const result = await verify(email, wrongCode);

    expect(result.status).toBe(400);
    expect(result.body.message).toContain("Te quedan 4 intentos");
  });

  it("rechaza un código que no tiene 6 dígitos", async () => {
    const result = await verify(email, "12ab");

    expect(result.status).toBe(400);
    expect(result.body.message).toContain("6 dígitos");
  });

  it("rechaza un código vencido", async () => {
    await setVerificationCode(email, knownCode, { expired: true });

    const result = await verify(email, knownCode);

    expect(result.status).toBe(400);
    expect(result.body.message).toContain("expiró");
  });

  it("no verifica la cuenta si la contraseña no es la de la cuenta", async () => {
    await setVerificationCode(email, knownCode);

    const result = await verify(email, knownCode, "otra-clave");

    expect(result.status).toBe(400);
    expect((await login(email)).status).toBe(403);
  });

  it("verifica la cuenta con el código correcto, inicia sesión y el código no se puede reutilizar", async () => {
    await setVerificationCode(email, knownCode);

    const verified = await verify(email, knownCode);
    const reused = await verify(email, knownCode);

    expect(verified.status).toBe(200);
    expect(verified.body.token).toBeTruthy();
    expect(verified.body.user.email).toBe(email);
    expect((await login(email)).status).toBe(200);
    expect(reused.status).toBe(400);
  });

  it("registrar de nuevo un email ya verificado responde 409", async () => {
    const result = await register(email);

    expect(result.status).toBe(409);
  });

  it("después de 5 intentos fallidos el código deja de servir, aunque se ingrese el correcto", async () => {
    await register(lockedEmail);
    await setVerificationCode(lockedEmail, knownCode);

    const attempts = [];
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      attempts.push(await verify(lockedEmail, wrongCode));
    }
    const withCorrectCode = await verify(lockedEmail, knownCode);

    expect(attempts.map((result) => result.status)).toEqual([400, 400, 400, 400, 400]);
    expect(attempts[4].body.message).toContain("ya no te quedan intentos");
    expect(withCorrectCode.status).toBe(429);
  });
});

describe("Reenvío del código", () => {
  it("no envía otro código antes de un minuto y después sí, con los intentos reiniciados", async () => {
    await register(resendEmail);
    await setCodeSentSecondsAgo(resendEmail, 0);

    const tooSoon = await api("POST", "/api/users/resend-code", { email: resendEmail });
    await database.query("UPDATE users SET verification_attempts = 3 WHERE email = $1", [resendEmail]);
    await setCodeSentSecondsAgo(resendEmail, 120);
    const resent = await api("POST", "/api/users/resend-code", { email: resendEmail });
    const account = await database.query("SELECT verification_attempts FROM users WHERE email = $1", [resendEmail]);

    expect(tooSoon.status).toBe(429);
    expect(resent.status).toBe(200);
    expect(account.rows[0].verification_attempts).toBe(0);
  });

  it("responde lo mismo para un email que no está registrado", async () => {
    const result = await api("POST", "/api/users/resend-code", { email: `no-existe-${testId}@hidrocenter.test` });

    expect(result.status).toBe(200);
  });

  it("volver a registrarse con una cuenta pendiente reemplaza la contraseña", async () => {
    await setCodeSentSecondsAgo(resendEmail, 120);

    const registered = await register(resendEmail, "clave-nueva");

    expect(registered.status).toBe(201);
    expect((await login(resendEmail, "clave-nueva")).status).toBe(403);
    expect((await login(resendEmail, password)).status).toBe(401);
  });
});
