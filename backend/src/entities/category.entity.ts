export interface Category {
  id: string;
  name: string;
  description?: string;
  groupName?: string | null;
  createdAt: string;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  // Grupo al que pertenece (por ejemplo "Bombas"). Sin grupo es una categoría suelta, como "Goteros".
  groupName?: string;
}
