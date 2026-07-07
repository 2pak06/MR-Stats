const CHANGES = [
  "додано запуск тренування",
  "додано підтвердження підходу",
  "додано таймер відпочинку",
  "додано відновлення тренування після перезапуску",
  "покращено структуру Training",
  "покращено автооновлення"
];

export function renderChangelog() {
  return `
    <aside class="card changelogBlock">
      <h3>📋 Зміни у поточній версії</h3>
      <ul>
        ${CHANGES.map((change) => `<li>${change}</li>`).join("")}
      </ul>
    </aside>
  `;
}
