const CHANGELOG = [
  {
    version: "v0.5.2",
    changes: [
      "🔊 Значно покращено звук завершення таймера у Training.",
      "🍳 Додано звуковий сигнал завершення таймера у Recipes.",
      "🔁 Звуковий сигнал повторюється, поки користувач його не зупинить.",
      '🔇 Додано кнопку "Зупинити звук" у Recipes.',
      "⚙️ Покращено спільну систему звукових сигналів таймерів."
    ]
  },
  {
    version: "v0.5.1",
    changes: [
      "додано запуск тренування",
      "додано підтвердження підходу",
      "додано таймер відпочинку",
      "додано відновлення тренування після перезапуску",
      "покращено структуру Training",
      "покращено автооновлення"
    ]
  }
];

export function renderChangelog() {
  return `
    <aside class="card changelogBlock">
      <h3>📋 Зміни у поточній версії</h3>
      ${CHANGELOG.map(renderVersionChanges).join("")}
    </aside>
  `;
}

function renderVersionChanges(entry) {
  return `
    <section class="changelogVersion">
      <h4>${entry.version}</h4>
      <ul>
        ${entry.changes.map((change) => `<li>${change}</li>`).join("")}
      </ul>
    </section>
  `;
}
