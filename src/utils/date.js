export function getTodayKey(date = new Date()) {
  return getDateKey(date);
}

export function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function addMonths(dateKey, amount) {
  const date = parseDateKey(dateKey);
  date.setMonth(date.getMonth() + amount, 1);

  return getDateKey(date);
}

export function formatDateLabel(dateKey) {
  return parseDateKey(dateKey).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

export function formatMonthLabel(dateKey) {
  return parseDateKey(dateKey).toLocaleDateString("uk-UA", {
    month: "long",
    year: "numeric"
  });
}

export function getMonthDays(dateKey) {
  const date = parseDateKey(dateKey);
  const year = date.getFullYear();
  const month = date.getMonth();
  const days = [];
  const firstDay = new Date(year, month, 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let index = 0; index < firstWeekday; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(getDateKey(new Date(year, month, day)));
  }

  return days;
}

export function getWeekdayShort(dateKey) {
  return parseDateKey(dateKey).toLocaleDateString("uk-UA", { weekday: "short" });
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) {
    return new Date();
  }

  return new Date(year, month - 1, day);
}
