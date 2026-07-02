export const navItems = [
  { id: "home", title: "Головна", icon: "🏠" },
  { id: "recipes", title: "Рецепти", icon: "🍗" },
  { id: "training", title: "Тренування", icon: "💪" },
  { id: "weight", title: "Вага", icon: "⚖️" },
  { id: "calendar", title: "Календар", icon: "📅" },
  { id: "shopping", title: "Покупки", icon: "🛒" },
  { id: "inventory", title: "Запаси", icon: "📦" },
  { id: "settings", title: "Налаштування", icon: "⚙️" }
];

export function renderNavigation(activePageId = "home") {
  return navItems.map((item) => `
    <button class="navBtn${item.id === activePageId ? " active" : ""}" data-page="${item.id}">
      ${item.icon} ${item.title}
    </button>
  `).join("");
}

export function getPageTitle(pageId) {
  return navItems.find((item) => item.id === pageId)?.title || navItems[0].title;
}
