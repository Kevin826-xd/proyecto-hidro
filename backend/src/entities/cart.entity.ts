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
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryDistanceKm?: number;
  deliveryCost?: number;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  total: number;
}

export interface CartWithReservations extends Cart {
  deliveryDate?: string;
  deliveryCity?: string;
  deliveryAddress?: string;
  deliveryReservations: DeliveryReservation[];
}

// Fila de cart_items junto con el nombre y el precio actual del producto.
export interface CartItemRow {
  productId: string;
  name: string;
  price: string | number;
  quantity: number;
}
