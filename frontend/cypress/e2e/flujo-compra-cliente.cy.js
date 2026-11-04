const customer = {
  name: "Cliente E2E",
  email: `cliente-e2e-${Date.now()}@hidrocenter.test`,
  password: "secreto123",
};


function readPrice(text) {
  return Number(text.replace(/\D/g, ""));
}

function login() {
  cy.get("#email").clear().type(customer.email);
  cy.get("#password").clear().type(customer.password, { log: false });
  cy.contains("button", "Entrar").click();
}

describe("Flujo de compra del cliente", () => {
  after(() => {
    cy.task("deleteUser", customer.email);
  });

  it("un visitante arma su carrito, se registra, es aprobado y conserva su carrito", () => {
    cy.visit("/");

    // Sin sesión se ven catálogo, carrito y despacho, pero no hay sesión activa.
    cy.get("#loginForm").should("not.be.visible");
    cy.get("#logoutBtn").should("not.be.visible");
    cy.get("#cartBtn").should("be.visible");
    cy.get("#shippingBtn").should("be.visible");
    cy.contains(".category-button", "Goteros").click();
    cy.get(".product-card").first().as("product");

    cy.get("@product").find("h2").invoke("text").then((nameText) => {
      cy.get("@product").find(".product-price").invoke("text").then((priceText) => {
        const productName = nameText.trim();
        const productPrice = readPrice(priceText);

        // El visitante puede agregar al carrito sin iniciar sesión.
        cy.get("@product").contains("button", "Agregar al carrito").click();
        cy.get("#statusMessage").should("contain", `${productName} agregado al carrito`);
        cy.get("#cartCount").should("have.text", "1");

        // Reservar el despacho (comprar) exige iniciar sesión.
        cy.get("#shippingBtn").click();
        cy.get("#reservationList").should("contain", "Inicia sesión para ver tus reservas");
        cy.get(".calendar-day:not([disabled]):not(.calendar-day-empty)").first().click();
        cy.get("#confirmShippingBtn").click();
        cy.get("#loginForm").should("be.visible");
        cy.get("#loginAuthMessage").should("contain", "Inicia sesión o regístrate para reservar");

        cy.get("#showRegisterBtn").click();
        cy.get("#registerName").type(customer.name);
        cy.get("#registerEmail").type(customer.email);
        cy.get("#registerPassword").type(customer.password, { log: false });
        cy.contains("button", "Registrarse").click();
        cy.get("#loginAuthMessage").should("contain", "Registro recibido");

        login();
        cy.get("#loginAuthMessage").should("contain", "pendiente de aprobación");
        cy.get("#logoutBtn").should("not.be.visible");

        cy.task("approveUser", customer.email);

        // Al entrar, el carrito del visitante pasa a su cuenta y vuelve al despacho para confirmar.
        login();
        cy.get("#logoutBtn").should("be.visible");
        cy.get("#shippingPanel").should("be.visible");
        cy.get("#statusMessage").should("contain", "confirma tu reserva");
        cy.get("#cartCount").should("have.text", "1");

        cy.get("#cartBtn").click();
        cy.get("#cartItemsList .cart-item").should("have.length", 1).and("contain", productName);
        cy.get('#cartItemsList [data-action="increase"]').click();
        cy.get("#cartCount").should("have.text", "2");
        cy.get("#cartTotal").should(($total) => {
          expect(readPrice($total.text())).to.equal(productPrice * 2);
        });

        cy.reload();
        cy.get("#logoutBtn").should("be.visible");
        cy.get("#cartCount").should("have.text", "2");

        cy.get("#cartBtn").click();
        cy.get('#cartItemsList [data-action="remove"]').click();
        cy.get("#cartItemsList").should("contain", "Tu carrito está vacío");
        cy.get("#cartCount").should("have.text", "0");
        cy.get("#logoutBtn").click();
        cy.get("#loginBtn").should("be.visible");
        cy.get("#categoriesContainer").should("contain", "Goteros");
      });
    });
  });
});
