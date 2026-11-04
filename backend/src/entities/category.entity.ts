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
}
