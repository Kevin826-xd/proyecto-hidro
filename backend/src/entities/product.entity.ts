export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId: string;
  diameter?: string;
  material?: string;
  workingPressure?: string;
  imageUrl?: string | null;
  createdAt: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId: string;
  diameter?: string;
  material?: string;
  workingPressure?: string;
  imageUrl?: string | null;
}

export type UpdateProductInput = Partial<CreateProductInput>;
