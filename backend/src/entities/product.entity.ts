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

// Una fila de la carga masiva: el producto y su nuevo precio y stock.
export interface PriceStockUpdate {
  id: string;
  price: number;
  stock: number;
}
