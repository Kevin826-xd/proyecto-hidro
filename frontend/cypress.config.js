const crypto = require("node:crypto");
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
        // Deja el correo verificado sin pasar por el código (para las pruebas que no prueban el registro).
        async verifyUser(email) {
          await database.query(
            `UPDATE users SET status = 'verified', verification_code_hash = NULL, verification_code_expires_at = NULL,
               verification_code_sent_at = NULL, verification_attempts = 0
             WHERE email = $1`,
            [email],
          );
          return null;
        },
        // El código real solo llega por correo: se guarda uno conocido, con el mismo hash que usa el backend
        // (HMAC-SHA256 con JWT_SECRET sobre "id:código", ver backend/src/services/verification.service.ts).
        async setVerificationCode({ email, code }) {
          const { rows } = await database.query("SELECT id FROM users WHERE email = $1", [email]);
          const userId = rows[0].id;
          const codeHash = crypto.createHmac("sha256", (process.env.JWT_SECRET ?? "").trim()).update(`${userId}:${code}`).digest("hex");
          await database.query(
            `UPDATE users
             SET verification_code_hash = $2, verification_code_expires_at = NOW() + INTERVAL '15 minutes', verification_attempts = 0
             WHERE id = $1`,
            [userId, codeHash],
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
        // Al borrar la cotización también se borran sus productos (ON DELETE CASCADE).
        async deleteQuotes(email) {
          await database.query("DELETE FROM quotes WHERE customer_email = $1", [email]);
          return null;
        },
        // Borra una categoría creada desde el panel de administración junto con sus productos.
        async deleteCategory(name) {
          await database.query("DELETE FROM products WHERE category_id IN (SELECT id FROM categories WHERE name = $1)", [name]);
          await database.query("DELETE FROM categories WHERE name = $1", [name]);
          return null;
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
