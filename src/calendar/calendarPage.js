import { getCalendarDay, saveCalendarDay } from "./calendarStorage.js";
import { saveWeightEntry } from "../storage/localStorage.js";
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

const CALENDAR_TASKS = [
  { key: "breakfast", label: "🥣 Сніданок" },
  { key: "lunch", label: "🍛 Обід" },
  { key: "dinner", label: "🍗 Вечеря" },
  { key: "snack", label: "🍎 Перекус" },
  { key: "training", label: "💪 Тренування" }
];

let todayDateKey = getTodayKey();
let visibleMonthKey = todayDateKey;
let selectedDateKey = todayDateKey;

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

    if (dayButton) {
      selectedDateKey = dayButton.dataset.calendarDate;
      visibleMonthKey = selectedDateKey;
      renderCalendar();
      return;
    }

    if (!action) {
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

  if (day.tasks.training) {
    lines.push("💪");
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
    <div class="calendarChecklist">
      ${CALENDAR_TASKS.map((task) => renderCheckRow(task, day.tasks[task.key])).join("")}
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

function renderCheckRow(task, checked) {
  return `
    <label class="checkRow calendarCheckRow">
      <input type="checkbox" data-calendar-task="${task.key}" ${checked ? "checked" : ""}>
      <span>${task.label}</span>
    </label>
  `;
}

function saveSelectedDay({ refreshCalendar = false } = {}) {
  const currentDay = getCalendarDay(selectedDateKey);
  const tasks = {};

  document.querySelectorAll("[data-calendar-task]").forEach((element) => {
    tasks[element.dataset.calendarTask] = element.checked;
  });

  saveCalendarDay(selectedDateKey, {
    tasks: {
      ...currentDay.tasks,
      ...tasks
    },
    weight: document.getElementById("calendarWeight")?.value || "",
    note: document.getElementById("calendarNote")?.value || ""
  });

  if (refreshCalendar) {
    renderCalendar();
  }

  window.dispatchEvent(new CustomEvent(CALENDAR_UPDATED_EVENT, {
    detail: { dateKey: selectedDateKey, source: "calendar" }
  }));
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
