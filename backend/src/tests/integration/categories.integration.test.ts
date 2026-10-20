import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { database } from "../../utils/database";
import { api } from "./helpers/api";

const testCategoryName = `Categoría test ${Date.now()}`;
let categoryId = "";

beforeAll(async () => {
  const category = await api("POST", "/api/categories", {
    name: testCategoryName,
    description: "Creada por las pruebas",
  });
  categoryId = category.body?.id ?? "";
});

afterAll(async () => {
  if (categoryId) {
    await database.query("DELETE FROM categories WHERE id = $1", [categoryId]);
  }
  await database.end();
});

describe("Categorías", () => {
  it("se creó la categoría, el listado devuelve Goteros y se rechaza una sin nombre", async () => {
    expect(categoryId).not.toBe("");

    const list = await api("GET", "/api/categories");

    expect(list.status).toBe(200);
    expect(list.body).toEqual([expect.objectContaining({ name: "Goteros" })]);

    const withoutName = await api("POST", "/api/categories", { name: "   " });

    expect(withoutName.status).toBe(400);
    expect(withoutName.body.message).toBe("El nombre de la categoría es obligatorio");
  });
});