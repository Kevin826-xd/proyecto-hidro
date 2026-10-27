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

  it("un cliente nuevo se registra, es aprobado y compra un producto", () => {
    cy.visit("/");

   
    cy.get("#showRegisterBtn").click();
    cy.get("#registerName").type(customer.name);
    cy.get("#registerEmail").type(customer.email);
    cy.get("#registerPassword").type(customer.password, { log: false });
    cy.contains("button", "Registrarse").click();
    cy.get("#loginAuthMessage").should("contain", "Registro recibido");

    
    login();
    cy.get("#loginAuthMessage").should("contain", "pendiente de aprobación");
    cy.get("#headerActions").should("not.be.visible");

  
    cy.task("approveUser", customer.email);

    
    login();
    cy.get("#headerActions").should("be.visible");
    cy.contains(".category-button", "Goteros").click();
    cy.get(".product-card").first().as("product");

    cy.get("@product").find("h2").invoke("text").then((nameText) => {
      cy.get("@product").find(".product-price").invoke("text").then((priceText) => {
        const productName = nameText.trim();
        const productPrice = readPrice(priceText);

       
        cy.get("@product").contains("button", "Agregar al carrito").click();
        cy.get("#statusMessage").should("contain", `${productName} agregado al carrito`);
        cy.get("#cartCount").should("have.text", "1");

       
        cy.get("#cartBtn").click();
        cy.get("#cartItemsList .cart-item").should("have.length", 1).and("contain", productName);
        cy.get('#cartItemsList [data-action="increase"]').click();
        cy.get("#cartCount").should("have.text", "2");
        cy.get("#cartTotal").should(($total) => {
          expect(readPrice($total.text())).to.equal(productPrice * 2);
        });

        
        cy.reload();
        cy.get("#headerActions").should("be.visible");
        cy.get("#cartCount").should("have.text", "2");

        
        cy.get("#cartBtn").click();
        cy.get('#cartItemsList [data-action="remove"]').click();
        cy.get("#cartItemsList").should("contain", "Tu carrito está vacío");
        cy.get("#cartCount").should("have.text", "0");
        cy.get("#logoutBtn").click();
        cy.get("#loginForm").should("be.visible");
      });
    });
  });
});
