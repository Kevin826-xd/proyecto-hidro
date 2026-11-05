import { RequestHandler } from "express";
import { createProduct, deleteProduct, getProductById, listProducts, updateProduct } from "../services/product.service";
import { readParam } from "../utils/request";
import { validateProductInput, validateProductUpdateInput } from "../validations/product.validation";

// Los errores (validación, no encontrado, etc.) los responde el middleware de errores.

export const getProducts: RequestHandler = async (_request, response) => {
  response.json(await listProducts());
};

export const getProductByIdController: RequestHandler = async (request, response) => {
  response.json(await getProductById(readParam(request.params.id)));
};

export const postProduct: RequestHandler = async (request, response) => {
  response.status(201).json(await createProduct(validateProductInput(request.body)));
};

export const updateProductController: RequestHandler = async (request, response) => {
  response.json(await updateProduct(readParam(request.params.id), validateProductUpdateInput(request.body)));
};

export const deleteProductController: RequestHandler = async (request, response) => {
  await deleteProduct(readParam(request.params.id));
  response.status(204).send();
};
