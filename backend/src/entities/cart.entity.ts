export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  id: string;
  userId?: string;
  items: CartItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCartItemInput {
  productId: string;
  quantity: number;
}

export interface CreateCartInput {
  userId?: string;
  items: CreateCartItemInput[];
}
