export const formatPrice = (value) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

export function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayForCalendar() {
  return getDateKey(new Date());
}

export function formatDate(dateValue) {
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("es-CL", { dateStyle: "long" });
}