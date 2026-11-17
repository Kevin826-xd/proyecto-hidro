import { beforeAll, describe, expect, it } from "vitest";
import {
  attemptsLeftMessage,
  generateVerificationCode,
  hashVerificationCode,
  verifyEmailCode,
} from "../../services/verification.service";

beforeAll(() => {
  // El hash usa la clave del servidor; sin backend/.env (por ejemplo, en otro equipo) se usa una de prueba.
  process.env.JWT_SECRET ||= "clave-de-prueba";
});

describe("Código de verificación", () => {
  it("siempre tiene 6 dígitos, también cuando el número empieza con ceros", () => {
    const codes = Array.from({ length: 500 }, generateVerificationCode);

    expect(codes.every((code) => /^\d{6}$/.test(code))).toBe(true);
    // Con 500 códigos al azar es prácticamente imposible que salgan todos iguales.
    expect(new Set(codes).size).toBeGreaterThan(1);
  });

  it("el hash depende de la cuenta: el mismo código de otra cuenta no sirve", () => {
    const hash = hashVerificationCode("cuenta-1", "123456");

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashVerificationCode("cuenta-1", "123456")).toBe(hash);
    expect(hashVerificationCode("cuenta-2", "123456")).not.toBe(hash);
    expect(hashVerificationCode("cuenta-1", "123457")).not.toBe(hash);
  });

  it("informa cuántos intentos quedan", () => {
    expect(attemptsLeftMessage(4)).toContain("Te quedan 4 intentos");
    expect(attemptsLeftMessage(1)).toContain("Te queda 1 intento");
    expect(attemptsLeftMessage(0)).toContain("ya no te quedan intentos");
  });

  it("rechaza un código con formato inválido sin consultar la base de datos", async () => {
    await expect(verifyEmailCode("cliente@correo.cl", "secreto123", "12345")).rejects.toThrow("6 dígitos");
    await expect(verifyEmailCode("cliente@correo.cl", "secreto123", "abcdef")).rejects.toThrow("6 dígitos");
  });
});
