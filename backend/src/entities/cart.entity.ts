export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface DeliveryReservation {
  deliveryDate: string;
  deliveryCity?: string;
  deliveryAddress?: string;
}

export interface Cart {
  id: string;
  userId?: string;
  items: CartItem[];
  total: number;
  deliveryDate?: string;
  deliveryCity?: string;
  deliveryAddress?: string;
  deliveryReservations: DeliveryReservation[];
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
