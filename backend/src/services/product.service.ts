import { randomUUID } from "node:crypto";
import { CreateProductInput, Product } from "../entities/product.entity";
import { categoryExists } from "./category.service";

const products: Product[] = [];

export function createProduct(input: CreateProductInput): Product {
  if (!categoryExists(input.categoryId)) {
    throw new Error("Category not found");
  }

  const product: Product = {
    id: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };

  products.push(product);
  return product;
}

export function listProducts(): Product[] {
  return products;
}
