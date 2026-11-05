import { RequestHandler } from "express";
import { createCategory, listCategories } from "../services/category.service";
import { validateCategoryInput } from "../validations/category.validation";

export const getCategories: RequestHandler = async (_request, response) => {
  response.json(await listCategories());
};

export const postCategory: RequestHandler = async (request, response) => {
  response.status(201).json(await createCategory(validateCategoryInput(request.body)));
};
