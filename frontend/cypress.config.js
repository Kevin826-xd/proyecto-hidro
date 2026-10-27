const path = require("node:path");
const { defineConfig } = require("cypress");
const dotenv = require("dotenv");
const { Pool } = require("pg");

// Las tareas usan la misma base de datos que el backend local.
dotenv.config({ path: path.resolve(__dirname, "../backend/.env"), quiet: true });
const database = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    // Valores públicos: se leen en las pruebas con Cypress.expose("...").
    expose: {
      apiUrl: "http://localhost:3000",
      adminEmail: process.env.ADMIN_EMAIL ?? "admin@hidrocenter.cl",
    },
    // Valores sensibles: se leen con cy.env([...]) y Cypress no los muestra en sus registros.
    env: {
      adminPassword: process.env.ADMIN_PASSWORD ?? "Admin123!",
    },
    setupNodeEvents(on) {
      // Cypress corre en el navegador; estas tareas se ejecutan en Node y pueden usar la base de datos.
      on("task", {
        async approveUser(email) {
          await database.query(
            "UPDATE users SET status = 'approved', approval_token_hash = NULL WHERE email = $1",
            [email],
          );
          return null;
        },
        async deleteUser(email) {
          // Al borrar el usuario también se borra su carrito (ON DELETE CASCADE).
          await database.query("DELETE FROM users WHERE email = $1", [email]);
          return null;
        },
        // Crea un producto en la categoría Goteros y devuelve su id.
        async createProduct({ name, price, stock }) {
          const result = await database.query(
            `INSERT INTO products (id, name, description, price, stock, category_id, created_at)
             VALUES (gen_random_uuid(), $1, 'Producto creado por Cypress', $2, $3,
               (SELECT id FROM categories WHERE name = 'Goteros' LIMIT 1), NOW())
             RETURNING id`,
            [name, price, stock],
          );
          return result.rows[0].id;
        },
        // Al borrar el producto también se borra de los carritos (ON DELETE CASCADE).
        async deleteProduct(id) {
          if (id) {
            await database.query("DELETE FROM products WHERE id = $1", [id]);
          }
          return null;
        },
      });
    },
  },
});
