export function getTodayKey(date = new Date()) {
  return date.toLocaleDateString("uk-UA");
}
