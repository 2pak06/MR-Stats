import { renderFuturePage } from "./futurePage.js";
import { renderHomePage } from "./home.js";
import { renderRecipesPage } from "./recipes.js";
import { renderSettingsPage } from "./settings.js";
import { renderTrainingPage } from "../training/trainingPage.js";
import { renderWeightPage } from "../weight/weightPage.js";

export function renderPages() {
  return [
    renderHomePage(),
    renderRecipesPage(),
    renderTrainingPage(),
    renderWeightPage(),
    renderFuturePage({
      id: "calendar",
      icon: "📅",
      title: "Календар",
      description: "Тут буде історія по днях."
    }),
    renderFuturePage({
      id: "shopping",
      icon: "🛒",
      title: "Покупки",
      description: "Тут буде список покупок і автододавання з рецептів."
    }),
    renderFuturePage({
      id: "inventory",
      icon: "📦",
      title: "Запаси",
      description: "Тут буде облік продуктів, залишків і термінів придатності."
    }),
    renderSettingsPage()
  ].join("");
}
