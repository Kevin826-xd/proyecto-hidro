import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { database } from "../../db/connection";
import { migrations } from "../../db/migrations";
import { api, createApprovedCustomer, TEST_PASSWORD } from "./helpers/api";

const API_URL = process.env.API_URL ?? "http://localhost:3000";
const customerEmail = `cliente-errores-${Date.now()}@hidrocenter.test`;
let customerToken = "";

beforeAll(async () => {
  customerToken = await createApprovedCustomer(customerEmail);
});

afterAll(async () => {
  await database.query("DELETE FROM users WHERE email = $1", [customerEmail]);
  await database.end();
});

describe("Manejo central de errores", () => {
  it("responde 404 con un id de producto mal escrito, sin error de la base de datos", async () => {
    const result = await api("GET", "/api/products/no-es-un-id");

    expect(result.status).toBe(404);
    expect(result.body.message).toBe("Producto no encontrado");
  });

  it("responde 404 en JSON para rutas de la API que no existen", async () => {
    const result = await api("GET", "/api/ruta-que-no-existe");

    expect(result.status).toBe(404);
    expect(result.body.message).toBe("Ruta no encontrada");
  });

  it("responde 400 si el cuerpo no es un JSON válido", async () => {
    const response = await fetch(`${API_URL}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ esto no es json",
    });

    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe("El cuerpo de la petición no es un JSON válido");
  });

  it("responde 400 si PostgreSQL rechaza el formato de un dato", async () => {
    const result = await api("PUT", "/api/cart/delivery-date/no-es-fecha", { deliveryDate: "2099-01-01" }, customerToken);

    expect(result.status).toBe(400);
    expect(result.body.message).toBe("Los datos enviados no tienen un formato válido");
  });

  it("responde 409 al registrar un email que ya existe", async () => {
    const result = await api("POST", "/api/users/register", { name: "Repetido", email: customerEmail, password: TEST_PASSWORD });

    expect(result.status).toBe(409);
    expect(result.body.message).toBe("Este email ya está registrado");
  });
});

describe("Migraciones", () => {
  it("registra todas las migraciones aplicadas", async () => {
    const result = await database.query<{ name: string }>("SELECT name FROM schema_migrations ORDER BY name");

    expect(result.rows.map((row) => row.name)).toEqual(migrations.map((migration) => migration.name));
  });
});
