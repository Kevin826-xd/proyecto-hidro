const testId = Date.now();
const groupName = `Grupo E2E ${testId}`;
const categoryName = `Presurizadoras E2E ${testId}`;
const product = { name: `Bomba presurizadora E2E ${testId}`, price: "129990", stock: "4" };

function readPrice(text) {
  return Number(text.replace(/\D/g, ""));
}

describe("Flujo del administrador: crear categoría y producto", () => {
  after(() => {
    // Borra la categoría creada desde el panel junto con su producto.
    cy.task("deleteCategory", categoryName);
  });

  it("el administrador crea una categoría con grupo y un producto, y un visitante lo ve en el catálogo", () => {
    cy.visit("/");
    cy.get("#loginBtn").click();
    cy.get("#email").clear().type(Cypress.expose("adminEmail"));
    cy.env(["adminPassword"]).then(({ adminPassword }) => {
      cy.get("#password").clear().type(adminPassword, { log: false });
    });
    cy.contains("button", "Entrar").click();
    cy.get("#adminPanel").should("be.visible");

    // Nueva categoría dentro de un grupo nuevo.
    cy.get("#newCategoryName").type(categoryName);
    cy.get("#newCategoryGroup").type(groupName);
    cy.contains("button", "Crear categoría").click();
    cy.get("#newCategoryMessage").should("contain", `Categoría "${categoryName}" creada en el grupo "${groupName}"`);

    // La categoría nueva queda elegida en el formulario de productos.
    cy.get("#newProductCategory").find("option:selected").should("have.text", categoryName);

    // Un precio de cero se rechaza antes de enviar.
    cy.get("#newProductName").type(product.name);
    cy.get("#newProductPrice").type("0");
    cy.get("#newProductStock").type(product.stock);
    cy.contains("button", "Crear producto").click();
    cy.get("#newProductMessage").should("contain", "El precio debe ser mayor que cero");

    cy.get("#newProductPrice").clear().type(product.price);
    cy.contains("button", "Crear producto").click();
    cy.get("#newProductMessage").should("contain", `Producto "${product.name}" creado`);

    // El panel de precios muestra el producto nuevo dentro de su grupo.
    cy.contains("#adminProducts tr", product.name).should("be.visible");
    cy.get("#adminProducts .admin-category[open] summary").should("contain", groupName);

    // Un visitante ve el grupo nuevo en la barra lateral y el producto con su precio.
    cy.get("#logoutBtn").click();
    cy.get("#loginBtn").should("be.visible");
    cy.get("#adminPanel").should("not.be.visible");
    cy.contains(".category-link", groupName).click();
    cy.contains(".product-card", product.name).as("card");
    cy.get("@card").find(".product-price").should(($price) => {
      expect(readPrice($price.text())).to.equal(Number(product.price));
    });
    cy.get("@card").find(".product-quantity strong").should("have.text", product.stock);
  });
});
