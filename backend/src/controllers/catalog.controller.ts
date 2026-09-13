import { RequestHandler } from "express";
import { createCategory, listCategories } from "../services/category.service";
import { createProduct, deleteProduct, getProductById, listProducts, updateProduct } from "../services/product.service";
import { validateCategoryInput, validateProductInput } from "../validations/catalog.validation";

export const postCategory: RequestHandler = async (request, response) => {
  try {
    response.status(201).json(await createCategory(validateCategoryInput(request.body)));
  } catch (error) {
    response.status(400).json({ message: (error as Error).message });
  }
};

export const getCategories: RequestHandler = async (_request, response) => {
  response.json(await listCategories());
};

export const postProduct: RequestHandler = async (request, response) => {
  try {
    response.status(201).json(await createProduct(validateProductInput(request.body)));
  } catch (error) {
    const message = (error as Error).message;
    response.status(message === "Category not found" ? 404 : 400).json({ message });
  }
};

export const getProducts: RequestHandler = async (_request, response) => {
  response.json(await listProducts());
};

export const getProductByIdController: RequestHandler = async (request, response) => {
  const { id } = request.params;
  const product = await getProductById(id);

  if (!product) {
    response.status(404).json({ message: "Product not found" });
    return;
  }

  response.json(product);
};

export const updateProductController: RequestHandler = async (request, response) => {
  const { id } = request.params;

  try {
    const updatedProduct = await updateProduct(id, request.body);

    if (!updatedProduct) {
      response.status(404).json({ message: "Product not found" });
      return;
    }

    response.json(updatedProduct);
  } catch (error) {
    const message = (error as Error).message;
    response.status(message === "Category not found" ? 404 : 400).json({ message });
  }
};

export const deleteProductController: RequestHandler = async (request, response) => {
  const { id } = request.params;
  const deleted = await deleteProduct(id);

  if (!deleted) {
    response.status(404).json({ message: "Product not found" });
    return;
  }

  response.status(204).send();
};
