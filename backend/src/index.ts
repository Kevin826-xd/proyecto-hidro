import express from "express";
import categoryRouter from "./routes/category.routes";
import productRouter from "./routes/product.routes";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "hidrocenter-api",
  });
});

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
});