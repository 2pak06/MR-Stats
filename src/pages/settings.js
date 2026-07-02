import { collectExportData } from "../storage/localStorage.js";

export function renderSettingsPage() {
  return `
    <section class="page" id="settings">
      <div class="card">
        <h3>⚙️ Налаштування</h3>
        <button class="action" type="button" data-action="export-data">Експорт даних</button>
        <p class="muted">Перший фундамент. Далі будемо переносити всі функції.</p>
      </div>
    </section>
  `;
}

export function initSettingsPage() {
  document.querySelector('[data-action="export-data"]').addEventListener("click", exportData);
}

function exportData() {
  const data = collectExportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "mr-stats-backup.json";
  link.click();

  URL.revokeObjectURL(url);
}
