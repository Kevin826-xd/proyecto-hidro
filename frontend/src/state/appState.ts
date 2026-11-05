import type { CartItem, DeliveryReservation } from "../types/api";

export type ShippingMethod = "pickup" | "home";

export interface AppState {
  cartItems: CartItem[];
  selectedShippingMethod: ShippingMethod;
  selectedDeliveryDate: string;
  savedDeliveryDate: string;
  editingDeliveryDate: string;
  reservedDeliveryCity: string;
  reservedDeliveryAddress: string;
  deliveryReservations: DeliveryReservation[];
  reservedDeliveryDates: string[];
  calendarMonth: Date;
}

export const appState: AppState = {
  cartItems: [],
  selectedShippingMethod: "pickup",
  selectedDeliveryDate: "",
  savedDeliveryDate: "",
  editingDeliveryDate: "",
  reservedDeliveryCity: "",
  reservedDeliveryAddress: "",
  deliveryReservations: [],
  reservedDeliveryDates: [],
  calendarMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
};
