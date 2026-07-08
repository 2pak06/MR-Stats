import { getCalendarDay, saveCalendarDay } from "../calendar/calendarStorage.js";
import { saveWeightEntry } from "../storage/localStorage.js";

const CALENDAR_UPDATED_EVENT = "calendar-day-updated";

export function renderHomePage() {
  return `
    <section class="page active" id="home">
      <div class="grid">
        <div class="card">
          <h3>✅ План на сьогодні</h3>
          <label class="checkRow"><input type="checkbox" data-task="breakfast"> 🌅 Сніданок</label>
          <label class="checkRow"><input type="checkbox" data-task="lunch"> 🍱 Обід</label>
          <label class="checkRow"><input type="checkbox" data-task="dinner"> 🌆 Вечеря</label>
          <label class="checkRow"><input type="checkbox" data-task="snack"> 🍎 Перекус</label>
          <label class="checkRow"><input type="checkbox" data-task="training"> 💪 Тренування</label>
        </div>

        <div class="card">
          <h3>⚖️ Швидкий запис ваги</h3>
          <input id="quickWeight" type="number" step="0.1" placeholder="Наприклад 57.4">
          <br><br>
          <button class="action" type="button" data-action="save-weight">Зберегти вагу</button>
          <p class="muted" id="weightStatus">Поки не записано.</p>
        </div>

        <div class="card">
          <h3>📝 Нотатки дня</h3>
          <textarea id="dayNote" placeholder="Що їв, як тренувався, самопочуття..."></textarea>
        </div>
      </div>
    </section>
  `;
}

export function initHomePage(todayKey) {
  const dayNote = document.getElementById("dayNote");
  const quickWeight = document.getElementById("quickWeight");
  const weightStatus = document.getElementById("weightStatus");
  const saveWeightButton = document.querySelector('[data-action="save-weight"]');

  applyHomeData(getCalendarDay(todayKey));

  document.querySelectorAll("[data-task]").forEach((element) => {
    element.addEventListener("change", () => saveToday(todayKey));
  });

  dayNote.addEventListener("input", () => saveToday(todayKey));

  saveWeightButton.addEventListener("click", () => saveQuickWeight(todayKey));

  window.addEventListener(CALENDAR_UPDATED_EVENT, (event) => {
    if (event.detail?.dateKey === todayKey && event.detail?.source !== "home") {
      applyHomeData(getCalendarDay(todayKey));
    }
  });
}

function saveToday(todayKey) {
  const currentDay = getCalendarDay(todayKey);
  const tasks = {};

  document.querySelectorAll("[data-task]").forEach((element) => {
    tasks[element.dataset.task] = element.checked;
  });

  const data = {
    tasks: {
      ...currentDay.tasks,
      ...tasks
    },
    note: document.getElementById("dayNote").value,
    weight: document.getElementById("quickWeight").value
  };

  saveCalendarDay(todayKey, data);
  notifyCalendarDayUpdated(todayKey);
}

function saveQuickWeight(todayKey) {
  const quickWeight = document.getElementById("quickWeight");
  const value = quickWeight.value;

  if (!value) {
    return;
  }

  saveWeightEntry({ date: todayKey, value });
  saveToday(todayKey);

  document.getElementById("weightStatus").textContent = `Записано: ${value} кг`;
}

function applyHomeData(data) {
  document.querySelectorAll("[data-task]").forEach((element) => {
    element.checked = Boolean(data.tasks[element.dataset.task]);
  });

  document.getElementById("dayNote").value = data.note || "";
  document.getElementById("quickWeight").value = data.weight || "";
  document.getElementById("weightStatus").textContent = data.weight
    ? `Записано: ${data.weight} кг`
    : "Поки не записано.";
}

function notifyCalendarDayUpdated(dateKey) {
  window.dispatchEvent(new CustomEvent(CALENDAR_UPDATED_EVENT, {
    detail: { dateKey, source: "home" }
  }));
}
