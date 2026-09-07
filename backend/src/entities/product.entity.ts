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
}
