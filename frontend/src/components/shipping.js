import { SHIPPING_LABELS } from "../config/constants.js";
import { editCartDeliveryReservation, getReservedDeliveryDates, removeCartDeliveryReservation, updateCartDeliveryDate } from "../services/cartService.js";
import { getCurrentUser } from "../services/sessionService.js";
import { formatDate, getDateKey, getTodayForCalendar } from "../utils/formatters.js";

export function updateShippingPanel(elements, state) {
  const requiresAddress = state.selectedShippingMethod !== "pickup";
  elements.shippingAddressField.classList.toggle("hidden", !requiresAddress);
  elements.confirmShippingBtn.textContent = state.editingDeliveryDate
    ? "Guardar cambios"
    : state.selectedDeliveryDate
      ? `Reservar ${SHIPPING_LABELS[state.selectedShippingMethod]}`
      : "Reservar día de despacho";
}

export function renderReservationHistory(elements, state) {
  if (!state.deliveryReservations.length) {
    elements.reservationList.innerHTML = '<p class="empty-reservations">Todavía no tienes reservas.</p>';
    return;
  }
  elements.reservationList.innerHTML = state.deliveryReservations.map((reservation) => {
    const location = reservation.deliveryCity && reservation.deliveryAddress ? `${reservation.deliveryCity} - ${reservation.deliveryAddress}` : "Retiro en tienda";
    return `<div class="reservation-item"><div><strong>${formatDate(reservation.deliveryDate)}</strong><span>${location}</span></div><div class="reservation-actions"><button class="button button-secondary small edit-reservation-btn" type="button" data-delivery-date="${reservation.deliveryDate}">Editar</button><button class="button button-secondary small remove-reservation-btn" type="button" data-delivery-date="${reservation.deliveryDate}">Eliminar</button></div></div>`;
  }).join("");
}

export function renderCalendar(elements, state) {
  const monthName = state.calendarMonth.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  elements.calendarMonthLabel.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const firstDay = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth(), 1);
  const daysInMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() + 1, 0).getDate();
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const cells = Array.from({ length: firstWeekday }, () => '<span class="calendar-day calendar-day-empty" aria-hidden="true"></span>');
  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = getDateKey(new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth(), day));
    const isPast = dateKey < getTodayForCalendar();
    const isSelected = dateKey === state.selectedDeliveryDate;
    const isReserved = state.reservedDeliveryDates.includes(dateKey);
    const classes = ["calendar-day", isSelected ? "selected" : "", isReserved ? "reserved" : "", dateKey === getTodayForCalendar() ? "today" : ""].filter(Boolean).join(" ");
    cells.push(`<button class="${classes}" type="button" data-date="${dateKey}" ${isPast || isReserved ? "disabled" : ""}><span>${day}</span></button>`);
  }
  elements.calendarGrid.innerHTML = cells.join("");
  elements.previousMonthBtn.disabled = state.calendarMonth.getFullYear() === new Date().getFullYear() && state.calendarMonth.getMonth() === new Date().getMonth();
  elements.calendarGrid.querySelectorAll(".calendar-day:not(.calendar-day-empty)").forEach((button) => button.addEventListener("click", () => {
    state.selectedDeliveryDate = button.dataset.date;
    elements.deliveryDate.value = state.selectedDeliveryDate;
    updateShippingPanel(elements, state);
    renderCalendar(elements, state);
  }));
}

export function attachShippingEvents(elements, state, setStatus, onReservationSaved) {
  const refreshReservations = async () => {
    const dates = await getReservedDeliveryDates();
    state.reservedDeliveryDates = Array.isArray(dates) ? dates : [];
    renderCalendar(elements, state);
    renderReservationHistory(elements, state);
  };

  elements.reservationList.addEventListener("click", async (event) => {
    const button = event.target.closest(".remove-reservation-btn");
    const editButton = event.target.closest(".edit-reservation-btn");

    if (editButton) {
      const reservation = state.deliveryReservations.find((item) => item.deliveryDate === editButton.dataset.deliveryDate);
      if (!reservation) return;
      state.editingDeliveryDate = reservation.deliveryDate;
      state.selectedDeliveryDate = reservation.deliveryDate;
      elements.deliveryDate.value = reservation.deliveryDate;
      elements.shippingCity.value = reservation.deliveryCity || "";
      elements.shippingAddress.value = reservation.deliveryAddress || "";
      updateShippingPanel(elements, state);
      renderCalendar(elements, state);
      setStatus("Edita los datos del despacho y presiona guardar.", "info");
      return;
    }

    if (!button) return;

    try {
      const user = getCurrentUser();
      const deliveryDate = button.dataset.deliveryDate;
      const cart = await removeCartDeliveryReservation(deliveryDate, user.email);
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
      setStatus(error.message || "No se pudo eliminar el despacho.", "error");
    }
  });

  elements.shippingPanel.querySelectorAll(".shipping-option").forEach((option) => option.addEventListener("click", () => {
    state.selectedShippingMethod = option.dataset.method;
    elements.shippingPanel.querySelectorAll(".shipping-option").forEach((item) => item.classList.toggle("active", item === option));
    updateShippingPanel(elements, state);
  }));
  elements.previousMonthBtn.addEventListener("click", () => {
    if (elements.previousMonthBtn.disabled) return;
    state.calendarMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() - 1, 1);
    renderCalendar(elements, state);
  });
  elements.nextMonthBtn.addEventListener("click", () => {
    state.calendarMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() + 1, 1);
    renderCalendar(elements, state);
  });
  elements.confirmShippingBtn.addEventListener("click", async () => {
    if (state.selectedShippingMethod !== "pickup" && !elements.shippingCity.value.trim()) {
      setStatus("Ingresa la ciudad de despacho.", "error");
      elements.shippingCity.focus();
      return;
    }
    if (state.selectedShippingMethod !== "pickup" && !elements.shippingAddress.value.trim()) {
      setStatus("Ingresa una dirección para el despacho.", "error");
      elements.shippingAddress.focus();
      return;
    }
    if (!elements.deliveryDate.value) {
      setStatus("Selecciona un día para reservar el despacho.", "error");
      return;
    }
    try {
      const user = getCurrentUser();
      const cart = state.editingDeliveryDate
        ? await editCartDeliveryReservation(state.editingDeliveryDate, elements.deliveryDate.value, elements.shippingCity.value, elements.shippingAddress.value, user.email)
        : await updateCartDeliveryDate(elements.deliveryDate.value, elements.shippingCity.value, elements.shippingAddress.value, user.email);
      state.selectedDeliveryDate = cart.deliveryDate;
      state.savedDeliveryDate = state.selectedDeliveryDate;
      state.editingDeliveryDate = "";
      state.reservedDeliveryCity = cart.deliveryCity || "";
      state.reservedDeliveryAddress = cart.deliveryAddress || "";
      state.deliveryReservations = Array.isArray(cart.deliveryReservations) ? cart.deliveryReservations : state.deliveryReservations;
      elements.shippingCity.value = "";
      elements.shippingAddress.value = "";
      renderCalendar(elements, state);
      renderReservationHistory(elements, state);
      updateShippingPanel(elements, state);
      onReservationSaved(state.selectedDeliveryDate);
    } catch (error) {
      console.error(error);
      setStatus(error.message || "No se pudo reservar el día de despacho.", "error");
    }
  });
  return async () => {
    try {
      const dates = await getReservedDeliveryDates();
      state.reservedDeliveryDates = Array.isArray(dates) ? dates : [];
      renderCalendar(elements, state);
    } catch (error) {
      console.error(error);
    }
  };
}