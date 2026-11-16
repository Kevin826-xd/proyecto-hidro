import { describe, expect, it } from "vitest";
import { normalizeRut, validateQuoteInput } from "../../validations/quote.validation";

const validQuote = {
  customerType: "person",
  customerName: "Juan Pérez",
  customerEmail: "juan@empresa.cl",
  customerPhone: "+56 9 1234 5678",
  items: [{ productId: "8a1bfafe-352a-4387-ac5e-04d404ebea9b", quantity: 2 }],
};

const companyQuote = {
  ...validQuote,
  customerType: "company",
  companyName: "Riegos del Sur SpA",
  companyRut: "111111111",
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

describe("Cotización para persona o empresa", () => {
  it("exige indicar si es para una persona o para una empresa", () => {
    const { customerType: _omitted, ...withoutType } = validQuote;

    expect(() => validateQuoteInput(withoutType)).toThrow("persona o para una empresa");
    expect(() => validateQuoteInput({ ...validQuote, customerType: "otro" })).toThrow("persona o para una empresa");
  });

  it("una persona no necesita empresa y se ignoran los datos de empresa que lleguen", () => {
    const quote = validateQuoteInput({ ...validQuote, companyName: "No corresponde", companyRut: "11.111.111-2" });

    expect(quote.customerType).toBe("person");
    expect(quote.companyName).toBeUndefined();
    expect(quote.companyRut).toBeUndefined();
  });

  it("una empresa debe indicar razón social y RUT válido", () => {
    const quote = validateQuoteInput(companyQuote);

    expect(quote.customerType).toBe("company");
    expect(quote.companyName).toBe("Riegos del Sur SpA");
    expect(quote.companyRut).toBe("11.111.111-1");
    expect(() => validateQuoteInput({ ...companyQuote, companyName: " " })).toThrow("razón social de la empresa es obligatoria");
    expect(() => validateQuoteInput({ ...companyQuote, companyRut: "" })).toThrow("RUT de la empresa es obligatorio");
    expect(() => validateQuoteInput({ ...companyQuote, companyRut: "11.111.111-2" })).toThrow("El RUT no es válido");
  });
});
