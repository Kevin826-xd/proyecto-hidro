import express from "express";
import path from "node:path";
import cartRouter from "./routes/cart.routes";
import categoryRouter from "./routes/category.routes";
import productRouter from "./routes/product.routes";
import userRouter from "./routes/user.routes";
import { corsMiddleware } from "./middlewares/cors.middleware";
import { apiNotFoundHandler, errorHandler } from "./middlewares/error.middleware";
import { checkDatabaseConnection } from "./db/connection";
import { runMigrations } from "./db/migrate";
import { seedDatabase } from "./db/seed";
import { getJwtSecret } from "./utils/token";

const app = express();
const port = Number(process.env.PORT ?? 3000);
const frontendPath = path.resolve(__dirname, "../../frontend/src");

app.use(corsMiddleware);
app.use(express.json());
app.use("/api/cart", cartRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);
app.use("/api/users", userRouter);

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "hidrocenter-api",
  });
});

app.use("/api", apiNotFoundHandler);

app.use(express.static(frontendPath));

app.get("/", (_request, response) => {
  response.sendFile(path.join(frontendPath, "index.html"));
});

app.get("/index.html", (_request, response) => {
  response.sendFile(path.join(frontendPath, "index.html"));
});

app.get(/^(?!\/api\/).*/, (request, response, next) => {
  if (request.path.startsWith("/api/")) {
    next();
    return;
  }

  response.sendFile(path.join(frontendPath, "index.html"));
});

// Debe ir al final: recibe los errores de todas las rutas anteriores.
app.use(errorHandler);

async function startServer(): Promise<void> {
  getJwtSecret();
  await checkDatabaseConnection();
  await runMigrations();
  await seedDatabase();
  console.log("Conexión a la base de datos exitosa");

  app.listen(port, () => {
    console.log(`API running on port ${port}`);
  });
}

startServer().catch((error: unknown) => {
  console.error("No se pudo iniciar el servidor", error);
  process.exit(1);
});