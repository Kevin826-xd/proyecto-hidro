const testId = Date.now();
// Sin stock: no se puede comprar, pero sí cotizar.
const product = { name: `Válvula E2E ${testId}`, price: 15990, stock: 0 };
const customer = {
  name: "Cliente Cotización E2E",
  email: `cotizacion-e2e-${testId}@hidrocenter.test`,
};
let productId = "";

function readPrice(text) {
  return Number(text.replace(/\D/g, ""));
}

describe("Flujo de cotización", () => {
  before(() => {
    cy.task("createProduct", product).then((id) => {
      productId = id;
    });
  });

  after(() => {
    cy.task("deleteQuotes", customer.email);
    cy.task("deleteProduct", productId);
  });

  it("un visitante sin sesión cotiza un producto sin stock desde el catálogo", () => {
    cy.visit("/");
    cy.get("#loginBtn").should("be.visible");
    cy.get("#quoteCount").should("have.text", "0");

    // En la tarjeta: sin stock no se compra, pero se puede agregar a la cotización con una cantidad.
    cy.contains(".category-link", "Goteros").click();
    cy.contains(".product-card", product.name).as("card");
    cy.get("@card").find(".add-to-cart-btn").should("be.disabled").and("have.text", "Sin stock");
    cy.get("@card").find(".product-qty-input").clear().type("3");
    cy.get("@card").contains("button", "Agregar a cotización").click();
    cy.get("#statusMessage").should("contain", `${product.name} agregado a la cotización (3 unidades)`);
    cy.get("#quoteCount").should("have.text", "1");

    // "Ver cotización" abre el panel con la lista y el total referencial.
    cy.get("@card").contains("button", "Ver cotización").click();
    cy.get("#quotePanel").should("be.visible");
    cy.get("#catalogLayout").should("not.be.visible");
    cy.get(".quote-item").should("have.length", 1).and("contain", product.name).and("contain", "Stock actual: 0");
    cy.get(".quote-item .quote-qty-input").should("have.value", "3");
    cy.get("#quoteTotal").should(($total) => {
      expect(readPrice($total.text())).to.equal(product.price * 3);
    });

    // Nombre, email y teléfono son obligatorios.
    cy.get("#quoteName").type(customer.name);
    cy.get("#quoteEmail").type(customer.email);
    cy.contains("button", "Solicitar cotización").click();
    cy.get("#quoteFormMessage").should("contain", "Escribe un teléfono");
    cy.get("#quotePhone").type("+56 9 1234 5678");

    // El backend revisa el dígito verificador del RUT.
    cy.get("#quoteRut").type("11.111.111-2");
    cy.contains("button", "Solicitar cotización").click();
    cy.get("#quoteFormMessage").should("contain", "El RUT no es válido");
    cy.get("#quoteRut").clear().type("111111111");
    cy.contains("button", "Solicitar cotización").click();

    // Confirmación con número, RUT con formato y el mismo total.
    cy.get("#quoteResult").should("be.visible").and("contain", "COT-").and("contain", "11.111.111-1");
    cy.get(".quote-result-total strong").should(($total) => {
      expect(readPrice($total.text())).to.equal(product.price * 3);
    });
    cy.get("#quoteCount").should("have.text", "0");

    cy.contains("button", "Volver al catálogo").click();
    cy.get("#catalogLayout").should("be.visible");
  });
});
