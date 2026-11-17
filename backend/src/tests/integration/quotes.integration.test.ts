import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { database } from "../../db/connection";
import { api, createVerifiedCustomer, loginAsAdmin } from "./helpers/api";

// Cotizaciones: un visitante las pide sin iniciar sesión y solo el administrador puede verlas.
const testId = Date.now();
const guestEmail = `cotizacion-visitante-${testId}@hidrocenter.test`;
const customerEmail = `cotizacion-cliente-${testId}@hidrocenter.test`;
const valvePrice = 15990;
const elbowPrice = 2500;
let adminToken = "";
let customerToken = "";
let categoryId = "";
let valveId = "";
let elbowId = "";

beforeAll(async () => {
  adminToken = await loginAsAdmin();
  customerToken = await createVerifiedCustomer(customerEmail);

  const category = await api("POST", "/api/categories", { name: `Cotización test ${testId}`, groupName: `Grupo test ${testId}` }, adminToken);
  categoryId = category.body.id;

  // Stock 2: se pueden cotizar más unidades que las disponibles.
  const valve = await api("POST", "/api/products", { name: `Válvula test ${testId}`, price: valvePrice, stock: 2, categoryId }, adminToken);
  const elbow = await api("POST", "/api/products", { name: `Codo test ${testId}`, price: elbowPrice, stock: 2, categoryId }, adminToken);
  valveId = valve.body.id;
  elbowId = elbow.body.id;
});

afterAll(async () => {
  // Al borrar la cotización también se borran sus productos (ON DELETE CASCADE).
  await database.query("DELETE FROM quotes WHERE customer_email = ANY($1)", [[guestEmail, customerEmail]]);
  await database.query("DELETE FROM users WHERE email = $1", [customerEmail]);
  // Si beforeAll falló (por ejemplo, con el backend apagado), la categoría nunca se creó.
  if (categoryId) {
    await database.query("DELETE FROM products WHERE category_id = $1", [categoryId]);
    await database.query("DELETE FROM categories WHERE id = $1", [categoryId]);
  }
  await database.end();
});

describe("Cotizaciones", () => {
  it("un visitante sin sesión cotiza y los precios salen de la base de datos", async () => {
    const result = await api("POST", "/api/quotes", {
      customerType: "person",
      customerName: "Visitante Test",
      customerEmail: guestEmail,
      customerPhone: "+56 9 1234 5678",
      items: [
        // El precio que envía el navegador se ignora.
        { productId: valveId, quantity: 3, price: 1 },
        { productId: elbowId, quantity: 10 },
      ],
    });

    expect(result.status).toBe(201);
    expect(result.body.number).toBeGreaterThan(0);
    expect(result.body.userId).toBeNull();
    expect(result.body.items.map((item: { unitPrice: number }) => item.unitPrice)).toEqual([valvePrice, elbowPrice]);
    expect(result.body.total).toBe(valvePrice * 3 + elbowPrice * 10);
    expect(result.body.customerType).toBe("person");
    expect(result.body.companyName).toBeNull();
  });

  it("una empresa cotiza con razón social y RUT, y se guarda quién la pidió", async () => {
    const result = await api("POST", "/api/quotes", {
      customerType: "company",
      customerName: "Compras Empresa",
      customerEmail: customerEmail,
      customerPhone: "+56 9 8765 4321",
      companyName: "Riegos del Sur SpA",
      companyRut: "111111111",
      items: [{ productId: valveId, quantity: 1 }],
    }, customerToken);

    expect(result.status).toBe(201);
    expect(result.body.customerType).toBe("company");
    expect(result.body.companyName).toBe("Riegos del Sur SpA");
    expect(result.body.companyRut).toBe("11.111.111-1");
    expect(result.body.userId).not.toBeNull();
  });

  it("rechaza la cotización de una empresa sin RUT o sin indicar el tipo de cliente", async () => {
    const base = {
      customerName: "Sin Datos",
      customerEmail: guestEmail,
      customerPhone: "+56 9 1234 5678",
      items: [{ productId: valveId, quantity: 1 }],
    };

    const withoutRut = await api("POST", "/api/quotes", { ...base, customerType: "company", companyName: "Empresa" });
    const withoutType = await api("POST", "/api/quotes", base);

    expect(withoutRut.status).toBe(400);
    expect(withoutRut.body.message).toBe("El RUT de la empresa es obligatorio");
    expect(withoutType.status).toBe(400);
  });

  it("solo el administrador puede ver las cotizaciones recibidas", async () => {
    expect((await api("GET", "/api/quotes")).status).toBe(401);
    expect((await api("GET", "/api/quotes", undefined, customerToken)).status).toBe(403);

    const asAdmin = await api("GET", "/api/quotes", undefined, adminToken);
    expect(asAdmin.status).toBe(200);

    const ours = asAdmin.body.find((quote: { customerEmail: string }) => quote.customerEmail === guestEmail);
    expect(ours).toBeDefined();
    expect(ours.items).toHaveLength(2);
  });
});
