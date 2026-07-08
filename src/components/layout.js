import { APP_VERSION } from "../config/appInfo.js";
import { renderChangelogButton } from "./changelog.js";
import { renderNavigation } from "./navigation.js";

export function renderLayout({ todayKey, pages }) {
  return `
    <div class="app">
      <aside class="sidebar">
        <div class="logo">
          <div class="logoIcon">📊</div>
          <div>
            <h1>MR Stats</h1>
            <p>v${APP_VERSION}</p>
          </div>
        </div>

        <nav class="nav" aria-label="Основна навігація">
          ${renderNavigation("home")}
        </nav>
      </aside>

      <main class="main">
        <div class="topbar">
          <h2 id="pageTitle">Головна</h2>
          <div class="topbarActions">
            ${renderChangelogButton()}
            <div class="dateBox" id="todayDate">${todayKey}</div>
          </div>
        </div>

        ${pages}
      </main>
    </div>
  `;
}
