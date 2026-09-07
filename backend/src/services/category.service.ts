import { randomUUID } from "node:crypto";
import { Category, CreateCategoryInput } from "../entities/category.entity";

const categories: Category[] = [];

export function createCategory(input: CreateCategoryInput): Category {
  const category: Category = {
    id: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };

  categories.push(category);
  return category;
}

export function listCategories(): Category[] {
  return categories;
}

export function categoryExists(categoryId: string): boolean {
  return categories.some((category) => category.id === categoryId);
}
