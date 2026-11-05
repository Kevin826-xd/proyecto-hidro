// Forma de los datos que devuelve la API del backend.
// Si cambia una respuesta en el backend, hay que actualizarla aquí para que TypeScript avise dónde se usa.

export type UserRole = "admin" | "customer";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  user: SessionUser;
  token: string;
  message: string;
}

export interface RegisterResponse {
  user: SessionUser & { status: "pending" | "approved" | "rejected" };
  message: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  groupName?: string | null;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  // PostgreSQL entrega los NUMERIC como texto, por eso el precio puede llegar como "180.00".
  price: number | string;
  stock: number;
  categoryId: string;
  diameter?: string | null;
  material?: string | null;
  workingPressure?: string | null;
  imageUrl?: string | null;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  // Solo el carrito del visitante guarda el stock, para avisar antes de pasarse.
  stock?: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

// Día de despacho reservado. Sin ciudad ni dirección es un retiro en tienda.
export interface DeliveryReservation {
  deliveryDate: string;
  deliveryCity?: string;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryDistanceKm?: number;
  deliveryCost?: number;
}

// En el panel de administración cada reserva trae el email de quien la hizo.
export interface AdminReservation extends DeliveryReservation {
  userId?: string;
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

// Lo que se envía al reservar o editar un despacho. En retiro en tienda va vacío.
export interface DeliveryLocationInput {
  deliveryCity?: string;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
}

export interface ShippingQuote {
  distanceKm: number;
  cost: number;
  pricePerKm: number;
  byRoad: boolean;
}
