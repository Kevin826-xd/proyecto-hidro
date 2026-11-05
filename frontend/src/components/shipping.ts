import { SHIPPING_LABELS } from "../config/constants";
import type { AppElements } from "../elements";
import { editCartDeliveryReservation, getReservedDeliveryDates, removeCartDeliveryReservation, updateCartDeliveryDate } from "../services/cartService";
import { isLoggedIn } from "../services/sessionService";
import type { AppState, ShippingMethod } from "../state/appState";
import type { Coordinates, DeliveryLocationInput, DeliveryReservation } from "../types/api";
import type { SetStatus } from "../types/ui";
import { getErrorMessage } from "../utils/formatters";
import { hasLocation } from "./deliveryMap";
import { renderReservationHistory } from "./reservationHistory";
import { attachCalendarEvents, renderCalendar } from "./shippingCalendar";
import {
  attachLocationEvents,
  clearDeliveryLocation,
  fillDeliveryLocation,
  getMarkedLocation,
  refreshMapIfVisible,
  setDeliveryArea,
} from "./shippingLocation";

// Formulario de despacho: une el tipo de entrega, el calendario, la ubicación y la lista de reservas.

interface ShippingDraft {
  method: ShippingMethod;
  city: string;
  address: string;
  location: Coordinates | null;
  date: string;
}

// Datos del despacho que llenó un visitante antes de que se le pidiera iniciar sesión.
let shippingDraft: ShippingDraft | null = null;

function isShippingMethod(value: string | undefined): value is ShippingMethod {
  return value === "pickup" || value === "home";
}

function selectShippingMethod(elements: AppElements, state: AppState, method: ShippingMethod): void {
  state.selectedShippingMethod = method;
  elements.shippingPanel.querySelectorAll<HTMLElement>(".shipping-option").forEach((item) => item.classList.toggle("active", item.dataset.method === method));
  updateShippingPanel(elements, state);
}

export function updateShippingPanel(elements: AppElements, state: AppState): void {
  const requiresAddress = state.selectedShippingMethod !== "pickup";
  elements.shippingAddressField.classList.toggle("hidden", !requiresAddress);
  elements.confirmShippingBtn.textContent = state.editingDeliveryDate
    ? "Guardar cambios"
    : state.selectedDeliveryDate
      ? `Reservar ${SHIPPING_LABELS[state.selectedShippingMethod]}`
      : "Reservar día de despacho";
  refreshMapIfVisible(elements);
}

// Vuelve a llenar el despacho con lo que el visitante dejó antes de iniciar sesión.
// Devuelve true si había datos guardados, para volver a mostrar el panel.
export function restoreShippingDraft(elements: AppElements, state: AppState): boolean {
  if (!shippingDraft) return false;
  const draft = shippingDraft;
  shippingDraft = null;

  fillDeliveryLocation(elements, { city: draft.city, address: draft.address, location: draft.location });
  state.selectedDeliveryDate = draft.date;
  elements.deliveryDate.value = draft.date;
  selectShippingMethod(elements, state, draft.method);
  renderCalendar(elements, state);
  return true;
}

function startEditingReservation(elements: AppElements, state: AppState, setStatus: SetStatus, reservation: DeliveryReservation): void {
  state.editingDeliveryDate = reservation.deliveryDate;
  state.selectedDeliveryDate = reservation.deliveryDate;
  elements.deliveryDate.value = reservation.deliveryDate;
  fillDeliveryLocation(elements, {
    city: reservation.deliveryCity || "",
    address: reservation.deliveryAddress || "",
    location: hasLocation(reservation) ? { lat: reservation.deliveryLat, lng: reservation.deliveryLng } : null,
  });
  selectShippingMethod(elements, state, reservation.deliveryAddress ? "home" : "pickup");
  renderCalendar(elements, state);
  setStatus("Edita los datos del despacho y presiona guardar.", "info");
}

// Revisa el formulario. Devuelve la ubicación marcada (null en retiro en tienda), o false si falta algo.
function validateShippingForm(elements: AppElements, state: AppState, setStatus: SetStatus): Coordinates | null | false {
  const isPickup = state.selectedShippingMethod === "pickup";
  if (!isPickup && !elements.shippingRegion.value) {
    setStatus("Selecciona la región de despacho.", "error");
    elements.shippingRegion.focus();
    return false;
  }
  if (!isPickup && !elements.shippingCity.value) {
    setStatus("Selecciona la ciudad de despacho.", "error");
    elements.shippingCity.focus();
    return false;
  }
  if (!isPickup && !elements.shippingAddress.value.trim()) {
    setStatus("Ingresa una dirección para el despacho.", "error");
    elements.shippingAddress.focus();
    return false;
  }
  const mapLocation = isPickup ? null : getMarkedLocation();
  if (!isPickup && !mapLocation) {
    setStatus("Marca en el mapa la ubicación donde se debe entregar el pedido.", "error");
    return false;
  }
  if (!elements.deliveryDate.value) {
    setStatus("Selecciona un día para reservar el despacho.", "error");
    return false;
  }
  return mapLocation;
}

// onLoginRequired se llama cuando un visitante sin sesión intenta reservar.
// Devuelve una función que recarga los días ocupados al abrir el panel.
export function attachShippingEvents(
  elements: AppElements,
  state: AppState,
  setStatus: SetStatus,
  onReservationSaved: (date: string) => void,
  onLoginRequired: () => void,
): () => Promise<void> {
  attachLocationEvents(elements);
  attachCalendarEvents(elements, state, () => updateShippingPanel(elements, state));

  const refreshReservations = async () => {
    const dates = await getReservedDeliveryDates();
    state.reservedDeliveryDates = Array.isArray(dates) ? dates : [];
    renderCalendar(elements, state);
    renderReservationHistory(elements, state);
  };

  elements.reservationList.addEventListener("click", async (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>(".remove-reservation-btn");
    const editButton = event.target.closest<HTMLButtonElement>(".edit-reservation-btn");

    if (editButton) {
      const reservation = state.deliveryReservations.find((item) => item.deliveryDate === editButton.dataset.deliveryDate);
      if (reservation) startEditingReservation(elements, state, setStatus, reservation);
      return;
    }

    const deliveryDate = button?.dataset.deliveryDate;
    if (!deliveryDate) return;

    try {
      const cart = await removeCartDeliveryReservation(deliveryDate);
      state.deliveryReservations = Array.isArray(cart.deliveryReservations) ? cart.deliveryReservations : [];
      if (state.savedDeliveryDate === deliveryDate) {
        state.selectedDeliveryDate = "";
        state.savedDeliveryDate = "";
        elements.deliveryDate.value = "";
        state.reservedDeliveryCity = "";
        state.reservedDeliveryAddress = "";
      }
      state.editingDeliveryDate = "";
      await refreshReservations();
      updateShippingPanel(elements, state);
      setStatus("Despacho eliminado correctamente.", "success");
    } catch (error) {
      console.error(error);
      setStatus(getErrorMessage(error, "No se pudo eliminar el despacho."), "error");
    }
  });

  elements.shippingPanel.querySelectorAll<HTMLElement>(".shipping-option").forEach((option) => option.addEventListener("click", () => {
    if (isShippingMethod(option.dataset.method)) selectShippingMethod(elements, state, option.dataset.method);
  }));

  elements.confirmShippingBtn.addEventListener("click", async () => {
    const mapLocation = validateShippingForm(elements, state, setStatus);
    if (mapLocation === false) return;

    // Ver y llenar el despacho es libre; reservar (comprar) exige iniciar sesión.
    if (!isLoggedIn()) {
      shippingDraft = {
        method: state.selectedShippingMethod,
        city: elements.shippingCity.value,
        address: elements.shippingAddress.value,
        location: mapLocation,
        date: elements.deliveryDate.value,
      };
      onLoginRequired();
      return;
    }
    const location: DeliveryLocationInput = mapLocation
      ? {
          deliveryCity: elements.shippingCity.value,
          deliveryAddress: elements.shippingAddress.value,
          deliveryLat: mapLocation.lat,
          deliveryLng: mapLocation.lng,
        }
      : {};
    try {
      const cart = state.editingDeliveryDate
        ? await editCartDeliveryReservation(state.editingDeliveryDate, elements.deliveryDate.value, location)
        : await updateCartDeliveryDate(elements.deliveryDate.value, location);
      state.selectedDeliveryDate = cart.deliveryDate ?? "";
      state.savedDeliveryDate = state.selectedDeliveryDate;
      state.editingDeliveryDate = "";
      state.reservedDeliveryCity = cart.deliveryCity || "";
      state.reservedDeliveryAddress = cart.deliveryAddress || "";
      state.deliveryReservations = Array.isArray(cart.deliveryReservations) ? cart.deliveryReservations : state.deliveryReservations;
      setDeliveryArea(elements);
      elements.shippingAddress.value = "";
      clearDeliveryLocation();
      renderCalendar(elements, state);
      renderReservationHistory(elements, state);
      updateShippingPanel(elements, state);
      onReservationSaved(state.selectedDeliveryDate);
    } catch (error) {
      console.error(error);
      setStatus(getErrorMessage(error, "No se pudo reservar el día de despacho."), "error");
    }
  });

  return async () => {
    refreshMapIfVisible(elements);
    try {
      const dates = await getReservedDeliveryDates();
      state.reservedDeliveryDates = Array.isArray(dates) ? dates : [];
      renderCalendar(elements, state);
    } catch (error) {
      console.error(error);
    }
  };
}
