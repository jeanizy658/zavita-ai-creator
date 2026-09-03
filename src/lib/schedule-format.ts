export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function parseISODate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { year: y ?? 2024, month: (m ?? 1) - 1, day: d ?? 1 };
}

export function toISODate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatLongDate(iso: string) {
  const { year, month, day } = parseISODate(iso);
  return `${MONTHS[month]} ${day}, ${year}`;
}

export function formatTime(t: { hour: number; minute: number; meridiem: "AM" | "PM" }) {
  return `${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(2, "0")} ${t.meridiem}`;
}
