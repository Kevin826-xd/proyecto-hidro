import { RequestHandler } from "express";
import { createCategory, listCategories } from "../services/category.service";
import { createProduct, listProducts } from "../services/product.service";
import { validateCategoryInput, validateProductInput } from "../validations/catalog.validation";

export const postCategory: RequestHandler = (request, response) => {
  try {
    response.status(201).json(createCategory(validateCategoryInput(request.body)));
  } catch (error) {
    response.status(400).json({ message: (error as Error).message });
  }
};

export const getCategories: RequestHandler = (_request, response) => {
  response.json(listCategories());
};

export const postProduct: RequestHandler = (request, response) => {
  try {
    response.status(201).json(createProduct(validateProductInput(request.body)));
  } catch (error) {
    const message = (error as Error).message;
    response.status(message === "Category not found" ? 404 : 400).json({ message });
  }
};

export const getProducts: RequestHandler = (_request, response) => {
  response.json(listProducts());
};
