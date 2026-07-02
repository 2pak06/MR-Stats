import { renderNavigation } from "./navigation.js";

export function renderLayout({ todayKey, pages }) {
  return `
    <div class="app">
      <aside class="sidebar">
        <div class="logo">
          <div class="logoIcon">📊</div>
          <div>
            <h1>MR Stats</h1>
            <p>v0.5.0 foundation</p>
          </div>
        </div>

        <nav class="nav" aria-label="Основна навігація">
          ${renderNavigation("home")}
        </nav>
      </aside>

      <main class="main">
        <div class="topbar">
          <h2 id="pageTitle">Головна</h2>
          <div class="dateBox" id="todayDate">${todayKey}</div>
        </div>

        ${pages}
      </main>
    </div>
  `;
}
