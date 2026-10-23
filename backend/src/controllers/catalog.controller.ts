import { RequestHandler } from "express";
import { createCategory, listCategories } from "../services/category.service";
import { createProduct, deleteProduct, getProductById, listProducts, updateProduct } from "../services/product.service";
import { validateCategoryInput, validateProductInput, validateProductUpdateInput } from "../validations/catalog.validation";

// Los errores (validación, no encontrado, etc.) los responde el middleware de errores.
function readId(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export const postCategory: RequestHandler = async (request, response) => {
  response.status(201).json(await createCategory(validateCategoryInput(request.body)));
};

export const getCategories: RequestHandler = async (_request, response) => {
  response.json(await listCategories());
};

export const postProduct: RequestHandler = async (request, response) => {
  response.status(201).json(await createProduct(validateProductInput(request.body)));
};

export const getProducts: RequestHandler = async (_request, response) => {
  response.json(await listProducts());
};

export const getProductByIdController: RequestHandler = async (request, response) => {
  response.json(await getProductById(readId(request.params.id)));
};

export const updateProductController: RequestHandler = async (request, response) => {
  response.json(await updateProduct(readId(request.params.id), validateProductUpdateInput(request.body)));
};

export const deleteProductController: RequestHandler = async (request, response) => {
  await deleteProduct(readId(request.params.id));
  response.status(204).send();
};
