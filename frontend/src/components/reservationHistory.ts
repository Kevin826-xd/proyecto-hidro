import type { AppElements } from "../elements";
import { isLoggedIn } from "../services/sessionService";
import type { AppState } from "../state/appState";
import type { DeliveryReservation } from "../types/api";
import { escapeHtml, formatDate, formatDistance, formatPrice } from "../utils/formatters";
import { hasLocation } from "./deliveryMap";

// Lista de despachos reservados por el cliente, con los botones para editar o eliminar cada uno.

function describeDeliveryCost(reservation: DeliveryReservation): string {
  return Number.isFinite(reservation.deliveryCost)
    ? `${formatPrice(reservation.deliveryCost)} · ${formatDistance(reservation.deliveryDistanceKm)}`
    : "";
}

function reservationMarkup(reservation: DeliveryReservation): string {
  // La ciudad y la dirección las escribe el cliente: se escapan para que no se interpreten como HTML.
  const location = reservation.deliveryCity && reservation.deliveryAddress
    ? escapeHtml(`${reservation.deliveryCity} - ${reservation.deliveryAddress}`)
    : "Retiro en tienda";
  const date = escapeHtml(reservation.deliveryDate);
  const cost = describeDeliveryCost(reservation);
  const mapNote = hasLocation(reservation)
    ? `<small class="reservation-map-note">Ubicación marcada en el mapa${cost ? ` · Despacho: ${cost}` : ""}</small>`
    : "";
  return `<div class="reservation-item"><div><strong>${formatDate(reservation.deliveryDate)}</strong><span>${location}</span>${mapNote}</div><div class="reservation-actions"><button class="button button-secondary small edit-reservation-btn" type="button" data-delivery-date="${date}">Editar</button><button class="button button-secondary small remove-reservation-btn" type="button" data-delivery-date="${date}">Eliminar</button></div></div>`;
}

export function renderReservationHistory(elements: AppElements, state: AppState): void {
  if (!isLoggedIn()) {
    elements.reservationList.innerHTML = '<p class="empty-reservations">Inicia sesión para ver tus reservas.</p>';
    return;
  }
  if (!state.deliveryReservations.length) {
    elements.reservationList.innerHTML = '<p class="empty-reservations">Todavía no tienes reservas.</p>';
    return;
  }
  elements.reservationList.innerHTML = state.deliveryReservations.map(reservationMarkup).join("");
}
