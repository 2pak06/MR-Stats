import { getCalendarDay, saveCalendarDay } from "./calendarStorage.js";
import { recipes } from "../recipes/recipeDatabase.js";
import { saveWeightEntry } from "../storage/localStorage.js";
import { loadWorkoutPrograms } from "../training/programStorage.js";
import {
  addMonths,
  formatDateLabel,
  formatMonthLabel,
  getMonthDays,
  getTodayKey,
  getWeekdayShort
} from "../utils/date.js";
import { escapeHtml } from "../utils/html.js";

const CALENDAR_UPDATED_EVENT = "calendar-day-updated";
const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
const MEAL_TASKS = ["breakfast", "lunch", "dinner", "snack"];

const MEAL_SLOTS = [
  { key: "breakfast", icon: "🥣", label: "Сніданок" },
  { key: "lunch", icon: "🍛", label: "Обід" },
  { key: "dinner", icon: "🍗", label: "Вечеря" },
  { key: "snack", icon: "🍎", label: "Перекус" }
];

let todayDateKey = getTodayKey();
let visibleMonthKey = todayDateKey;
let selectedDateKey = todayDateKey;
let pickerState = null;
let saveStateTimer = null;

export function renderCalendarPage() {
  return `
    <section class="page" id="calendar">
      <div class="calendarPage">
        <div class="card calendarHeaderCard">
          <div>
            <p class="muted">Календар</p>
            <h3 id="calendarMonthTitle"></h3>
          </div>
          <div class="calendarNav">
            <button class="secondaryAction" type="button" data-calendar-action="previous-month">Попередній місяць</button>
            <button class="action" type="button" data-calendar-action="today">Сьогодні</button>
            <button class="secondaryAction" type="button" data-calendar-action="next-month">Наступний місяць</button>
          </div>
        </div>

        <div class="calendarWorkspace">
          <div class="card calendarMonthCard">
            <div class="calendarWeekdays">
              ${WEEKDAYS.map((weekday) => `<div>${weekday}</div>`).join("")}
            </div>
            <div class="calendarMonthGrid" id="calendarMonthGrid"></div>
          </div>

          <aside class="card calendarDetailsCard" id="calendarDayDetails"></aside>
        </div>

        <div class="calendarPickerOverlay" id="calendarPicker" hidden>
          <div class="card calendarPickerModal">
            <div class="calendarPickerHeader">
              <h3 id="calendarPickerTitle"></h3>
              <button class="secondaryAction" type="button" data-calendar-action="close-picker">Закрити</button>
            </div>
            <div class="calendarPickerChoices" id="calendarPickerChoices"></div>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function initCalendarPage(todayKey) {
  todayDateKey = todayKey;
  visibleMonthKey = todayKey;
  selectedDateKey = todayKey;
  renderCalendar();

  const calendarPage = document.getElementById("calendar");

  calendarPage?.addEventListener("click", (event) => {
    const dayButton = event.target.closest("[data-calendar-date]");
    const action = event.target.closest("[data-calendar-action]")?.dataset.calendarAction;
    const pickButton = event.target.closest("[data-calendar-pick]");
    const choiceButton = event.target.closest("[data-calendar-choice]");
    const clearButton = event.target.closest("[data-calendar-clear]");
    const taskButton = event.target.closest("[data-calendar-toggle]");

    if (dayButton) {
      selectedDateKey = dayButton.dataset.calendarDate;
      visibleMonthKey = selectedDateKey;
      renderCalendar();
      return;
    }

    if (pickButton) {
      openPicker(pickButton.dataset.calendarPick, pickButton.dataset.calendarSlot);
      return;
    }

    if (choiceButton) {
      applyPickerChoice(choiceButton.dataset.calendarChoice);
      return;
    }

    if (clearButton) {
      clearPickerSlot();
      return;
    }

    if (taskButton) {
      toggleCalendarTask(taskButton.dataset.calendarToggle);
      return;
    }

    if (!action) {
      return;
    }

    if (action === "close-picker") {
      closePicker();
      return;
    }

    if (action === "previous-month") {
      visibleMonthKey = addMonths(visibleMonthKey, -1);
    }

    if (action === "today") {
      todayDateKey = getTodayKey();
      visibleMonthKey = todayDateKey;
      selectedDateKey = todayDateKey;
    }

    if (action === "next-month") {
      visibleMonthKey = addMonths(visibleMonthKey, 1);
    }

    renderCalendar();
  });

  calendarPage?.addEventListener("change", (event) => {
    saveSelectedDay({ refreshCalendar: true });

    if (event.target.matches("#calendarWeight") && event.target.value) {
      saveWeightEntry({
        date: selectedDateKey,
        value: event.target.value
      });
    }
  });

  calendarPage?.addEventListener("input", (event) => {
    if (event.target.matches("#calendarWeight, #calendarNote")) {
      saveSelectedDay();

      if (event.target.matches("#calendarWeight") && event.target.value) {
        saveWeightEntry({
          date: selectedDateKey,
          value: event.target.value
        });
      }
    }
  });

  window.addEventListener(CALENDAR_UPDATED_EVENT, (event) => {
    if (event.detail?.source === "calendar") {
      return;
    }

    if (event.detail?.dateKey === selectedDateKey || event.detail?.dateKey === todayDateKey) {
      renderCalendar();
    }
  });
}

function renderCalendar() {
  document.getElementById("calendarMonthTitle").textContent = capitalize(formatMonthLabel(visibleMonthKey));
  document.getElementById("calendarMonthGrid").innerHTML = renderMonthGrid();
  document.getElementById("calendarDayDetails").innerHTML = renderSelectedDayDetails();
}

function renderMonthGrid() {
  return getMonthDays(visibleMonthKey).map((dateKey) => {
    if (!dateKey) {
      return '<div class="calendarDayCell calendarDayCellEmpty"></div>';
    }

    const day = getCalendarDay(dateKey);
    const dayNumber = Number(dateKey.split("-")[2]);
    const className = [
      "calendarDayCell",
      dateKey === todayDateKey ? "calendarDayToday" : "",
      dateKey === selectedDateKey ? "calendarDaySelected" : ""
    ].filter(Boolean).join(" ");

    return `
      <button class="${className}" type="button" data-calendar-date="${dateKey}">
        <span class="calendarDayNumber">${dayNumber}</span>
        <span class="calendarDayWeekday">${capitalize(getWeekdayShort(dateKey))}</span>
        <span class="calendarDayStatus">${renderDayStatus(day)}</span>
      </button>
    `;
  }).join("");
}

function renderDayStatus(day) {
  const mealsDone = MEAL_TASKS.filter((task) => day.tasks[task]).length;
  const lines = [`🥣 ${mealsDone}/4`];

  if (day.trainingPlan?.programId) {
    lines.push(day.tasks.training ? "💪✓" : "💪");
  }

  if (day.weight) {
    lines.push(`⚖️ ${escapeHtml(day.weight)}`);
  }

  return lines.join("<br>");
}

function renderSelectedDayDetails() {
  const day = getCalendarDay(selectedDateKey);

  return `
    <p class="muted">Обраний день</p>
    <h3>${formatDateLabel(selectedDateKey)}</h3>

    <div class="calendarSectionTitle">
      <h4>Харчування</h4>
      <span class="calendarSaveState" id="calendarSaveState">Збережено ✓</span>
    </div>
    <div class="calendarSlotList">
      ${MEAL_SLOTS.map((slot) => renderMealSlot(slot, day)).join("")}
    </div>

    <div class="calendarSectionTitle">
      <h4>Тренування</h4>
    </div>
    <div class="calendarSlotList">
      ${renderTrainingSlot(day)}
    </div>

    <label>
      <span class="muted">Вага, кг</span>
      <input id="calendarWeight" type="number" step="0.1" placeholder="Наприклад 57.4" value="${escapeHtml(day.weight || "")}">
    </label>
    <label>
      <span class="muted">Нотатки дня</span>
      <textarea id="calendarNote" placeholder="Самопочуття, харчування, тренування...">${escapeHtml(day.note || "")}</textarea>
    </label>
  `;
}

function renderMealSlot(slot, day) {
  const recipeId = day.meals?.[slot.key] || "";
  const recipe = recipeId ? recipes.find((item) => item.id === recipeId) : null;
  const checked = Boolean(day.tasks[slot.key]);

  return `
    <div class="calendarSlot ${checked ? "calendarSlotDone" : ""}">
      <div class="calendarSlotIcon">${slot.icon}</div>
      <div class="calendarSlotText">
        <strong>${slot.label}</strong>
        <span>${recipe ? escapeHtml(recipe.title) : "Нічого не заплановано"}</span>
      </div>
      <div class="calendarSlotActions">
        <button class="secondaryAction compactAction" type="button" data-calendar-pick="meal" data-calendar-slot="${slot.key}">
          ${recipe ? "Змінити" : "Обрати"}
        </button>
        <button class="secondaryAction compactAction" type="button" data-calendar-toggle="${slot.key}">
          ${checked ? "✓" : "○"}
        </button>
      </div>
    </div>
  `;
}

function renderTrainingSlot(day) {
  const programs = loadWorkoutPrograms();
  const programId = day.trainingPlan?.programId || "";
  const program = programId ? programs.find((item) => item.id === programId) : null;
  const checked = Boolean(day.tasks.training);

  return `
    <div class="calendarSlot ${checked ? "calendarSlotDone" : ""}">
      <div class="calendarSlotIcon">💪</div>
      <div class="calendarSlotText">
        <strong>Тренування</strong>
        <span>${program ? escapeHtml(program.name) : "Нічого не заплановано"}</span>
      </div>
      <div class="calendarSlotActions">
        <button class="secondaryAction compactAction" type="button" data-calendar-pick="training" data-calendar-slot="training">
          ${program ? "Змінити" : "Обрати"}
        </button>
        <button class="secondaryAction compactAction" type="button" data-calendar-toggle="training">
          ${checked ? "✓" : "○"}
        </button>
      </div>
    </div>
  `;
}

function saveSelectedDay({ refreshCalendar = false } = {}) {
  const currentDay = getCalendarDay(selectedDateKey);

  saveCalendarDay(selectedDateKey, {
    tasks: {
      ...currentDay.tasks
    },
    meals: currentDay.meals,
    trainingPlan: currentDay.trainingPlan,
    weight: document.getElementById("calendarWeight")?.value || "",
    note: document.getElementById("calendarNote")?.value || ""
  });

  showCalendarSaveState();

  if (refreshCalendar) {
    renderCalendar();
  }

  dispatchCalendarUpdate();
}

function toggleCalendarTask(taskKey) {
  const day = getCalendarDay(selectedDateKey);

  saveCalendarDay(selectedDateKey, {
    ...day,
    tasks: {
      ...day.tasks,
      [taskKey]: !day.tasks[taskKey]
    }
  });

  renderCalendar();
  dispatchCalendarUpdate();
}

function openPicker(type, slotKey) {
  pickerState = { type, slotKey };

  document.getElementById("calendarPickerTitle").textContent = type === "meal"
    ? "Оберіть рецепт"
    : "Оберіть тренування";
  document.getElementById("calendarPickerChoices").innerHTML = renderPickerChoices(type);
  document.getElementById("calendarPicker").hidden = false;
}

function closePicker() {
  pickerState = null;
  document.getElementById("calendarPicker").hidden = true;
}

function renderPickerChoices(type) {
  const items = type === "meal" ? recipes : loadWorkoutPrograms();

  if (!items.length) {
    return '<p class="muted">Немає доступних варіантів.</p>';
  }

  return `
    ${items.map((item) => renderPickerChoice(type, item)).join("")}
    <button class="calendarPickerChoice calendarPickerClear" type="button" data-calendar-clear>
      Очистити слот
    </button>
  `;
}

function renderPickerChoice(type, item) {
  const title = type === "meal" ? item.title : item.name;
  const meta = type === "meal"
    ? [item.category, item.cookingTime].filter(Boolean).join(" · ")
    : `${item.exercises?.length || 0} вправ`;

  return `
    <button class="calendarPickerChoice" type="button" data-calendar-choice="${escapeHtml(item.id)}">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(meta)}</span>
    </button>
  `;
}

function applyPickerChoice(itemId) {
  if (!pickerState) {
    return;
  }

  const day = getCalendarDay(selectedDateKey);

  if (pickerState.type === "meal") {
    day.meals[pickerState.slotKey] = itemId;
  }

  if (pickerState.type === "training") {
    day.trainingPlan = { programId: itemId };
  }

  saveCalendarDay(selectedDateKey, day);
  closePicker();
  renderCalendar();
  dispatchCalendarUpdate();
}

function clearPickerSlot() {
  if (!pickerState) {
    return;
  }

  const day = getCalendarDay(selectedDateKey);

  if (pickerState.type === "meal") {
    day.meals[pickerState.slotKey] = "";
  }

  if (pickerState.type === "training") {
    day.trainingPlan = null;
  }

  saveCalendarDay(selectedDateKey, day);
  closePicker();
  renderCalendar();
  dispatchCalendarUpdate();
}

function showCalendarSaveState() {
  const saveState = document.getElementById("calendarSaveState");

  if (!saveState) {
    return;
  }

  saveState.classList.add("show");
  clearTimeout(saveStateTimer);
  saveStateTimer = setTimeout(() => saveState.classList.remove("show"), 900);
}

function dispatchCalendarUpdate() {
  window.dispatchEvent(new CustomEvent(CALENDAR_UPDATED_EVENT, {
    detail: { dateKey: selectedDateKey, source: "calendar" }
  }));
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
