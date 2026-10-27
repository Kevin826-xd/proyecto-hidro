const testId = Date.now();
const product = { name: `Bomba E2E ${testId}`, price: 10000, stock: 5 };
const customer = {
  name: "Cliente E2E",
  email: `cliente-admin-e2e-${testId}@hidrocenter.test`,
  password: "secreto123",
};
let productId = "";

function readPrice(text) {
  return Number(text.replace(/\D/g, ""));
}

function login(email, password) {
  cy.get("#email").clear().type(email);
  cy.get("#password").clear().type(password, { log: false });
  cy.contains("button", "Entrar").click();
  cy.get("#headerActions").should("be.visible");
}

function logout() {
  cy.get("#logoutBtn").click();
  cy.get("#loginForm").should("be.visible");
}

describe("Flujo del administrador", () => {
  before(() => {
    cy.task("createProduct", product).then((id) => {
      productId = id;
    });

    cy.request("POST", `${Cypress.expose("apiUrl")}/api/users/register`, customer);
    cy.task("approveUser", customer.email);
  });

  after(() => {
    cy.task("deleteUser", customer.email);
    cy.task("deleteProduct", productId);
  });

  it("el administrador cambia precio y stock, y el cliente ve los cambios", () => {
    cy.visit("/");

    
    cy.env(["adminPassword"]).then(({ adminPassword }) => {
      login(Cypress.expose("adminEmail"), adminPassword);
    });
    cy.get("#adminPanel").should("be.visible");
    cy.contains("#adminProducts tr", product.name).as("productRow");

   
    cy.get("@productRow").find(".admin-product-price").clear().type("0");
    cy.get("@productRow").contains("button", "Guardar").click();
    cy.get("#statusMessage").should("contain", "El precio debe ser mayor que cero");

    
    cy.get("@productRow").find(".admin-product-price").clear().type("12500");
    cy.get("@productRow").find(".admin-product-stock").clear().type("3");
    cy.get("@productRow").contains("button", "Guardar").click();
    cy.get("#statusMessage").should("contain", "Producto actualizado correctamente");
    logout();

    
    login(customer.email, customer.password);
    cy.get("#adminPanel").should("not.be.visible");

 
    cy.contains(".category-button", "Goteros").click();
    cy.contains(".product-card", product.name).as("productCard");
    cy.get("@productCard").find(".product-price").should(($price) => {
      expect(readPrice($price.text())).to.equal(12500);
    });
    cy.get("@productCard").find(".product-quantity strong").should("have.text", "3");

    
    for (let units = 1; units <= 3; units += 1) {
      cy.get("@productCard").contains("button", "Agregar al carrito").click();
      cy.get("#cartCount").should("have.text", String(units));
    }

    cy.get("@productCard").contains("button", "Agregar al carrito").click();
    cy.get("#statusMessage").should("contain", "Solo quedan 3 unidades disponibles");
    cy.get("#cartCount").should("have.text", "3");

    logout();
  });
});
