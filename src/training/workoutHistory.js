const WORKOUT_HISTORY_KEY = "mr_training_history";

export function loadWorkoutHistory() {
  return readJson(WORKOUT_HISTORY_KEY, []);
}

export function addWorkoutHistoryEntry(entry) {
  const history = loadWorkoutHistory();
  const nextHistory = [entry, ...history].slice(0, 100);

  localStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(nextHistory));
  return nextHistory;
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}
