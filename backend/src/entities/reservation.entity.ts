// Día de despacho reservado por un cliente. Sin ciudad ni dirección es un retiro en tienda.
export interface DeliveryReservation {
  deliveryDate: string;
  deliveryCity?: string;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryDistanceKm?: number;
  deliveryCost?: number;
}
