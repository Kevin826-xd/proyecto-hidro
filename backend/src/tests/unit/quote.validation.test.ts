import { describe, expect, it } from "vitest";
import { normalizeRut, validateQuoteInput } from "../../validations/quote.validation";

const validQuote = {
  customerName: "Juan Pérez",
  customerEmail: "juan@empresa.cl",
  customerPhone: "+56 9 1234 5678",
  items: [{ productId: "8a1bfafe-352a-4387-ac5e-04d404ebea9b", quantity: 2 }],
};

describe("Validación de cotizaciones", () => {
  it("acepta un RUT con dígito verificador correcto y rechaza uno incorrecto", () => {
    // Con o sin puntos y guion se guarda siempre con el mismo formato.
    expect(normalizeRut("111111111")).toBe("11.111.111-1");
    expect(normalizeRut("10000013-k")).toBe("10.000.013-K");
    // Mismo número con el dígito verificador equivocado.
    expect(normalizeRut("11.111.111-2")).toBeNull();
  });

  it("exige un teléfono con entre 8 y 15 dígitos", () => {
    expect(validateQuoteInput(validQuote).customerPhone).toBe("+56 9 1234 5678");
    expect(() => validateQuoteInput({ ...validQuote, customerPhone: "" })).toThrow("El teléfono es obligatorio");
    expect(() => validateQuoteInput({ ...validQuote, customerPhone: "12345" })).toThrow("entre 8 y 15 dígitos");
  });
});
