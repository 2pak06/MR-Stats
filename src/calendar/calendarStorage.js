const CALENDAR_PREFIX = "mr_calendar_";
const LEGACY_TODAY_PREFIX = "mr_today_";

const DEFAULT_TASKS = {
  breakfast: false,
  lunch: false,
  dinner: false,
  snack: false,
  training: false,
  water: false,
  sleep: false
};

const DEFAULT_DAY = {
  tasks: { ...DEFAULT_TASKS },
  meals: {},
  trainingPlan: null,
  weight: "",
  note: ""
};

export function getCalendarDay(dateKey) {
  const storedDay = readJson(CALENDAR_PREFIX + dateKey, null);

  if (storedDay) {
    return normalizeCalendarDay(storedDay);
  }

  const legacyDay = readLegacyTodayData(dateKey);

  if (legacyDay) {
    const migratedDay = normalizeCalendarDay(legacyDay);
    saveCalendarDay(dateKey, migratedDay);

    return migratedDay;
  }

  return createEmptyDay();
}

export function saveCalendarDay(dateKey, data) {
  localStorage.setItem(CALENDAR_PREFIX + dateKey, JSON.stringify(normalizeCalendarDay(data)));
}

export function updateCalendarDay(dateKey, partialData) {
  const day = getCalendarDay(dateKey);
  const updatedDay = normalizeCalendarDay({
    ...day,
    ...partialData,
    tasks: {
      ...day.tasks,
      ...(partialData.tasks || {})
    }
  });

  saveCalendarDay(dateKey, updatedDay);

  return updatedDay;
}

export function markTrainingCompleted(dateKey) {
  return updateCalendarDay(dateKey, {
    tasks: {
      training: true
    }
  });
}

function createEmptyDay() {
  return {
    ...DEFAULT_DAY,
    tasks: { ...DEFAULT_TASKS }
  };
}

function normalizeCalendarDay(data = {}) {
  const meals = normalizeMeals(data.meals || {});
  const trainingPlan = normalizeTrainingPlan(data.trainingPlan || data.training);

  return {
    ...DEFAULT_DAY,
    ...data,
    tasks: {
      ...DEFAULT_TASKS,
      ...(data.tasks || {}),
      breakfast: data.tasks?.breakfast ?? Boolean(data.breakfast),
      lunch: data.tasks?.lunch ?? Boolean(data.lunch),
      dinner: data.tasks?.dinner ?? Boolean(data.dinner),
      snack: data.tasks?.snack ?? Boolean(data.snack),
      training: data.tasks?.training ?? Boolean(data.trainingDone),
      water: data.tasks?.water ?? Boolean(data.waterDone),
      sleep: data.tasks?.sleep ?? Boolean(data.sleepDone)
    },
    meals,
    trainingPlan,
    weight: data.weight || "",
    note: data.note || ""
  };
}

function normalizeMeals(meals = {}) {
  return {
    breakfast: normalizeRecipeId(meals.breakfast),
    lunch: normalizeRecipeId(meals.lunch),
    dinner: normalizeRecipeId(meals.dinner),
    snack: normalizeRecipeId(meals.snack)
  };
}

function normalizeRecipeId(entry) {
  if (!entry) {
    return "";
  }

  if (typeof entry === "string") {
    return entry;
  }

  return entry.recipeId || entry.id || "";
}

function normalizeTrainingPlan(trainingPlan) {
  if (!trainingPlan) {
    return null;
  }

  return {
    programId: trainingPlan.programId || trainingPlan.id || ""
  };
}

function readLegacyTodayData(dateKey) {
  return readJson(LEGACY_TODAY_PREFIX + dateKey, null)
    || readJson(LEGACY_TODAY_PREFIX + toLegacyDateKey(dateKey), null);
}

function toLegacyDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-");

  return `${Number(day)}.${Number(month)}.${year}`;
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}
