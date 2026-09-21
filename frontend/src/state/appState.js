export const appState = {
  cartItems: [],
  selectedShippingMethod: "pickup",
  selectedDeliveryDate: "",
  savedDeliveryDate: "",
  reservedDeliveryCity: "",
  reservedDeliveryAddress: "",
  deliveryReservations: [],
  reservedDeliveryDates: [],
  calendarMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
};