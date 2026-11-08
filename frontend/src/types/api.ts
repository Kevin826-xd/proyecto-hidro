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

// Lo que se envía al crear una categoría. Sin groupName es una categoría suelta, como Goteros.
export interface NewCategoryInput {
  name: string;
  groupName?: string;
  description?: string;
}

// Lo que se envía al crear un producto. Los campos opcionales vacíos no se envían.
export interface NewProductInput {
  name: string;
  categoryId: string;
  price: number;
  stock: number;
  description?: string;
  material?: string;
  diameter?: string;
  workingPressure?: string;
  imageUrl?: string;
}

// Producto en la lista de cotización que arma el cliente en el navegador (antes de enviarla).
export interface QuoteListItem {
  productId: string;
  name: string;
  // Precio al momento de agregarlo: es referencial, el precio final lo pone el backend.
  price: number;
  stock: number;
  quantity: number;
}

// Lo que se envía al pedir una cotización: solo productos y cantidades, más los datos de contacto.
export interface NewQuoteInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName?: string;
  companyRut?: string;
  notes?: string;
  items: Array<{ productId: string; quantity: number }>;
}

export interface QuoteItem {
  productId: string | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

// Cotización guardada en el backend, con los precios que valen para el cliente.
export interface Quote {
  id: string;
  number: number;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  companyName: string | null;
  companyRut: string | null;
  notes: string | null;
  items: QuoteItem[];
  total: number;
  validUntil: string;
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
