import express from "express";
import path from "node:path";
import cartRouter from "./routes/cart.routes";
import categoryRouter from "./routes/category.routes";
import productRouter from "./routes/product.routes";
import userRouter from "./routes/user.routes";
import { corsMiddleware } from "./middlewares/cors.middleware";
import { checkDatabaseConnection, initializeDatabase } from "./utils/database";

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

async function startServer(): Promise<void> {
  await checkDatabaseConnection();
  await initializeDatabase();
  console.log("Conexión a la base de datos exitosa");

  app.listen(port, () => {
    console.log(`API running at http://localhost:${port}`);
  });
}

startServer().catch((error: unknown) => {
  console.error("Could not connect to the database", error);
  process.exit(1);
});