import { initChangelog, renderChangelogModal } from "./components/changelog.js";
import { renderLayout } from "./components/layout.js";
import { getPageTitle } from "./components/navigation.js";
import { renderPages } from "./pages/index.js";
import { initHomePage } from "./pages/home.js";
import { initRecipesPage } from "./pages/recipes.js";
import { initSettingsPage } from "./pages/settings.js";
import { getTodayKey } from "./utils/date.js";

const todayKey = getTodayKey();
const appRoot = document.getElementById("app");

appRoot.innerHTML = `
  ${renderLayout({
    todayKey,
    pages: renderPages()
  })}
  ${renderChangelogModal()}
`;

initNavigation();
initHomePage(todayKey);
initRecipesPage();
initSettingsPage();
initChangelog();

function initNavigation() {
  document.querySelectorAll(".navBtn").forEach((button) => {
    button.addEventListener("click", () => activatePage(button.dataset.page));
  });
}

function activatePage(pageId) {
  document.querySelectorAll(".navBtn").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === pageId);
  });

  document.querySelectorAll(".page").forEach((page) => {
    page.classList.toggle("active", page.id === pageId);
  });

  document.getElementById("pageTitle").textContent = getPageTitle(pageId);
}
