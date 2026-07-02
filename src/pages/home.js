import { addWeightEntry, loadTodayData, saveTodayData } from "../storage/localStorage.js";

export function renderHomePage() {
  return `
    <section class="page active" id="home">
      <div class="grid">
        <div class="card">
          <h3>✅ План на сьогодні</h3>
          <label class="checkRow"><input type="checkbox" data-save="breakfast"> 🌅 Сніданок</label>
          <label class="checkRow"><input type="checkbox" data-save="lunch"> 🍱 Обід</label>
          <label class="checkRow"><input type="checkbox" data-save="dinner"> 🌆 Вечеря</label>
          <label class="checkRow"><input type="checkbox" data-save="snack"> 🍎 Перекус</label>
          <label class="checkRow"><input type="checkbox" data-save="trainingDone"> 💪 Тренування</label>
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
  const data = loadTodayData(todayKey);
  const dayNote = document.getElementById("dayNote");
  const quickWeight = document.getElementById("quickWeight");
  const weightStatus = document.getElementById("weightStatus");
  const saveWeightButton = document.querySelector('[data-action="save-weight"]');

  document.querySelectorAll("[data-save]").forEach((element) => {
    element.checked = Boolean(data[element.dataset.save]);
    element.addEventListener("change", () => saveToday(todayKey));
  });

  dayNote.value = data.note || "";
  dayNote.addEventListener("input", () => saveToday(todayKey));

  if (data.weight) {
    quickWeight.value = data.weight;
    weightStatus.textContent = `Записано: ${data.weight} кг`;
  }

  saveWeightButton.addEventListener("click", () => saveQuickWeight(todayKey));
}

function saveToday(todayKey) {
  const data = {};

  document.querySelectorAll("[data-save]").forEach((element) => {
    data[element.dataset.save] = element.checked;
  });

  data.note = document.getElementById("dayNote").value;
  data.weight = document.getElementById("quickWeight").value;

  saveTodayData(todayKey, data);
}

function saveQuickWeight(todayKey) {
  const quickWeight = document.getElementById("quickWeight");
  const value = quickWeight.value;

  if (!value) {
    return;
  }

  addWeightEntry({ date: todayKey, value });
  saveToday(todayKey);

  document.getElementById("weightStatus").textContent = `Записано: ${value} кг`;
}
