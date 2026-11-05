import type { AppElements } from "../elements";
import type { AppState } from "../state/appState";
import { getDateKey, getTodayForCalendar } from "../utils/formatters";

// Calendario para elegir el día de despacho. Los días pasados y los ya reservados no se pueden elegir.

export function renderCalendar(elements: AppElements, state: AppState): void {
  const monthName = state.calendarMonth.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  elements.calendarMonthLabel.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const firstDay = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth(), 1);
  const daysInMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() + 1, 0).getDate();
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const today = getTodayForCalendar();
  const cells = Array.from({ length: firstWeekday }, () => '<span class="calendar-day calendar-day-empty" aria-hidden="true"></span>');
  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = getDateKey(new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth(), day));
    const isPast = dateKey < today;
    const isSelected = dateKey === state.selectedDeliveryDate;
    const isReserved = state.reservedDeliveryDates.includes(dateKey);
    const classes = ["calendar-day", isSelected ? "selected" : "", isReserved ? "reserved" : "", dateKey === today ? "today" : ""].filter(Boolean).join(" ");
    cells.push(`<button class="${classes}" type="button" data-date="${dateKey}" ${isPast || isReserved ? "disabled" : ""}><span>${day}</span></button>`);
  }
  elements.calendarGrid.innerHTML = cells.join("");
  elements.previousMonthBtn.disabled = state.calendarMonth.getFullYear() === new Date().getFullYear() && state.calendarMonth.getMonth() === new Date().getMonth();
}

function changeMonth(elements: AppElements, state: AppState, offset: number): void {
  state.calendarMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() + offset, 1);
  renderCalendar(elements, state);
}

// Los eventos se conectan una sola vez sobre la grilla, así sirven aunque el calendario se vuelva a dibujar.
// onDateSelected se llama cuando el cliente elige un día.
export function attachCalendarEvents(elements: AppElements, state: AppState, onDateSelected: () => void): void {
  elements.calendarGrid.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const dayButton = event.target.closest<HTMLButtonElement>("button.calendar-day");
    if (!dayButton || dayButton.disabled || !dayButton.dataset.date) return;
    state.selectedDeliveryDate = dayButton.dataset.date;
    elements.deliveryDate.value = state.selectedDeliveryDate;
    onDateSelected();
    renderCalendar(elements, state);
  });

  elements.previousMonthBtn.addEventListener("click", () => {
    if (elements.previousMonthBtn.disabled) return;
    changeMonth(elements, state, -1);
  });
  elements.nextMonthBtn.addEventListener("click", () => changeMonth(elements, state, 1));
}
