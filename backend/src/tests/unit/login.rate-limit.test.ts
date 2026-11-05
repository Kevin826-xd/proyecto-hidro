import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { loginRateLimit } from "../../middlewares/rate-limit.middleware";

// App mínima con el mismo límite que /api/users/login: la contraseña "correcta" responde 200 y cualquier otra 401.
function createLoginApp() {
  const app = express();
  app.use(express.json());
  app.post("/login", loginRateLimit, (req, res) => {
    if (req.body.password === "correcta") {
      res.json({ token: "token" });
      return;
    }
    res.status(401).json({ message: "Credenciales inválidas" });
  });
  return app;
}

describe("límite de intentos de inicio de sesión", () => {
  it("bloquea con 429 después de 10 intentos fallidos", async () => {
    const app = createLoginApp();

    for (let attempt = 1; attempt <= 10; attempt += 1) {
      const response = await request(app).post("/login").send({ password: "incorrecta" });
      expect(response.status).toBe(401);
    }

    const blocked = await request(app).post("/login").send({ password: "correcta" });
    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toContain("Demasiados intentos");
  });

  it("no cuenta los inicios de sesión correctos", async () => {
    const app = createLoginApp();
    // Cada prueba usa otra IP para no compartir el contador con la prueba anterior.
    const ip = "10.0.0.2";
    app.set("trust proxy", true);

    for (let attempt = 1; attempt <= 15; attempt += 1) {
      const response = await request(app).post("/login").set("X-Forwarded-For", ip).send({ password: "correcta" });
      expect(response.status).toBe(200);
    }
  });
});
