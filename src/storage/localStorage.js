const TODAY_PREFIX = "mr_today_";
const WEIGHTS_KEY = "mr_weights";
const EXPORT_PREFIX = "mr_";
const RECIPE_PROGRESS_PREFIX = "mr_recipe_progress_";

export function loadTodayData(todayKey) {
  return readJson(TODAY_PREFIX + todayKey, {});
}

export function saveTodayData(todayKey, data) {
  localStorage.setItem(TODAY_PREFIX + todayKey, JSON.stringify(data));
}

export function addWeightEntry(entry) {
  const weights = readJson(WEIGHTS_KEY, []);
  weights.unshift(entry);
  localStorage.setItem(WEIGHTS_KEY, JSON.stringify(weights.slice(0, 100)));
}

export function collectExportData() {
  const data = {};

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);

    if (key && key.startsWith(EXPORT_PREFIX)) {
      data[key] = localStorage.getItem(key);
    }
  }

  return data;
}

export function loadRecipeProgress(recipeId) {
  return readJson(RECIPE_PROGRESS_PREFIX + recipeId, null);
}

export function saveRecipeProgress(recipeId, progress) {
  localStorage.setItem(RECIPE_PROGRESS_PREFIX + recipeId, JSON.stringify({
    ...progress,
    updatedAt: new Date().toISOString()
  }));
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}
