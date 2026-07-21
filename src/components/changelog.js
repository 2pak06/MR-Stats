import { APP_VERSION } from "../config/appInfo.js";

const CHANGELOG_STORAGE_KEY = "mr_seen_changelog_version";

const CURRENT_VERSION_CHANGES = [
  {
    title: "🎨 Іконка застосунку",
    changes: [
      "🎨 Оновлено офіційну іконку MR Stats.",
      "🖥 Нова іконка відображається у вікні програми, на панелі задач і в ярликах Windows.",
      "📦 Оновлено іконку інсталятора."
    ]
  }
];

const ALL_VERSION_CHANGES = [
  {
    version: "v0.5.6",
    changes: [
      "🎨 Оновлено офіційну іконку MR Stats.",
      "🖥 Нова іконка відображається у вікні програми, на панелі задач і в ярликах Windows.",
      "📦 Оновлено іконку інсталятора."
    ]
  },
  {
    version: "v0.5.5",
    changes: [
      "Виправлено адаптивність календаря на різних розмірах екрана.",
      "Виправлено втрату фокусу в полях вводу під час набору тексту."
    ]
  },
  {
    version: "v0.5.4",
    changes: [
      "Календар.",
      "Синхронізація з головною сторінкою.",
      "Вага і нотатки по датах.",
      "Автоматична відмітка тренування після завершення."
    ]
  },
  {
    version: "v0.5.3",
    changes: [
      'Нове вікно "Що нового".',
      "Показ поточних змін.",
      "Автоматичне відкриття один раз після оновлення.",
      "Виправлення українських назв у changelog."
    ]
  },
  {
    version: "v0.5.2",
    changes: [
      "Звуковий сигнал завершення таймера у Тренуваннях.",
      "Звуковий сигнал завершення таймера у Рецептах.",
      "Повторюваний сигнал до ручного зупинення.",
      'Кнопка "Зупинити звук".'
    ]
  },
  {
    version: "v0.5.1",
    changes: [
      "Запуск тренування.",
      "Підтвердження підходу.",
      "Таймер відпочинку.",
      "Відновлення тренування після перезапуску.",
      "Покращення структури Тренувань.",
      "Покращення автооновлення."
    ]
  },
  {
    version: "v0.5.0",
    changes: [
      'Додано вкладку "Рецепти".',
      "Додано базу рецептів.",
      "Додано перегляд рецепта з інгредієнтами та кроками приготування.",
      "Додано таймери приготування у рецептах.",
      "Додано збереження прогресу рецепта.",
      "Додано головну сторінку з планом на сьогодні, швидким записом ваги і нотатками дня.",
      'Додано вкладку "Вага" для відстеження зважувань.'
    ]
  }
];

export function renderChangelogButton() {
  return `
    <button class="secondaryAction changelogOpenBtn" type="button" data-action="open-changelog" data-changelog-mode="current">
      Що нового
    </button>
    <button class="secondaryAction changelogOpenBtn" type="button" data-action="open-changelog" data-changelog-mode="all">
      Всі оновлення
    </button>
  `;
}

export function renderChangelogModal() {
  return `
    <div class="changelogOverlay" id="changelogOverlay" hidden>
      <section class="card changelogModal" role="dialog" aria-modal="true" aria-labelledby="changelogTitle">
        <div class="changelogModalHeader">
          <h3 id="changelogTitle">Що нового у версії ${APP_VERSION}</h3>
          <button class="secondaryAction" type="button" data-action="close-changelog">Закрити</button>
        </div>
        <div id="changelogContent">
          ${renderCurrentVersionChanges()}
        </div>
      </section>
    </div>
  `;
}

export function initChangelog() {
  document.querySelectorAll('[data-action="open-changelog"]').forEach((button) => {
    button.addEventListener("click", () => openChangelog(button.dataset.changelogMode || "current"));
  });

  document.querySelectorAll('[data-action="close-changelog"]').forEach((button) => {
    button.addEventListener("click", closeChangelog);
  });

  document.getElementById("changelogOverlay")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) {
      closeChangelog();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !document.getElementById("changelogOverlay")?.hasAttribute("hidden")) {
      closeChangelog();
    }
  });

  if (localStorage.getItem(CHANGELOG_STORAGE_KEY) !== APP_VERSION) {
    openChangelog("current");
  }
}

function renderCurrentVersionChanges() {
  return CURRENT_VERSION_CHANGES.map(renderChangeCategory).join("");
}

function renderAllVersionChanges() {
  return ALL_VERSION_CHANGES.map((release) => `
    <section class="changelogCategory changelogVersion">
      <h4>${release.version}</h4>
      <ul>
        ${release.changes.map((change) => `<li>${change}</li>`).join("")}
      </ul>
    </section>
  `).join("");
}

function renderChangeCategory(category) {
  return `
    <section class="changelogCategory">
      <h4>${category.title}</h4>
      <ul>
        ${category.changes.map((change) => `<li>${change}</li>`).join("")}
      </ul>
    </section>
  `;
}

function openChangelog(mode = "current") {
  const title = document.getElementById("changelogTitle");
  const content = document.getElementById("changelogContent");

  if (title && content) {
    title.textContent = mode === "all"
      ? "Всі оновлення"
      : `Що нового у версії ${APP_VERSION}`;
    content.innerHTML = mode === "all"
      ? renderAllVersionChanges()
      : renderCurrentVersionChanges();
  }

  document.getElementById("changelogOverlay")?.removeAttribute("hidden");
}

function closeChangelog() {
  localStorage.setItem(CHANGELOG_STORAGE_KEY, APP_VERSION);
  document.getElementById("changelogOverlay")?.setAttribute("hidden", "");
}
