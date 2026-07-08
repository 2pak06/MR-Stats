import { APP_VERSION } from "../config/appInfo.js";

const CHANGELOG_STORAGE_KEY = "mr_seen_changelog_version";

const CURRENT_VERSION_CHANGES = [
  {
    title: "✨ Покращення",
    changes: [
      'Оновлено вікно "Що нового".',
      "У програмі тепер показуються тільки зміни поточної версії.",
      "Старі версії більше не показуються в програмі.",
      "Повна історія релізів залишається на GitHub.",
      'Вікно "Що нового" автоматично відкривається один раз після оновлення.',
      "Після закриття воно більше не відкривається автоматично для цієї версії."
    ]
  },
  {
    title: "🐞 Виправлення",
    changes: [
      "Виправлено англійські назви у списку змін: тепер використовуються українські назви вкладок."
    ]
  }
];

export function renderChangelogButton() {
  return `
    <button class="secondaryAction changelogOpenBtn" type="button" data-action="open-changelog">
      Що нового
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
        ${CURRENT_VERSION_CHANGES.map(renderChangeCategory).join("")}
      </section>
    </div>
  `;
}

export function initChangelog() {
  document.querySelectorAll('[data-action="open-changelog"]').forEach((button) => {
    button.addEventListener("click", () => openChangelog());
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
    openChangelog();
  }
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

function openChangelog() {
  document.getElementById("changelogOverlay")?.removeAttribute("hidden");
}

function closeChangelog() {
  localStorage.setItem(CHANGELOG_STORAGE_KEY, APP_VERSION);
  document.getElementById("changelogOverlay")?.setAttribute("hidden", "");
}
