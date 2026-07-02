import { recipes, getRecipeById } from "../recipes/recipeDatabase.js";
import { loadRecipeProgress, saveRecipeProgress } from "../storage/localStorage.js";
import { escapeHtml } from "../utils/html.js";

const FAVORITES_KEY = "mr_recipe_favorites";

const emptyProgress = {
  currentStepIndex: 0,
  remainingSeconds: null,
  isTimerPaused: false,
  isTimerRunning: false,
  completedSteps: []
};

let viewMode = "list";
let selectedRecipeId = recipes[0]?.id || null;
let selectedServingsByRecipe = {};
let searchQuery = "";
let selectedCategory = "all";
let favoriteRecipeIds = [];
let progress = { ...emptyProgress };
let timerId = null;

export function renderRecipesPage() {
  return `
    <section class="page" id="recipes">
      <div id="recipesRoot"></div>
    </section>
  `;
}

export function initRecipesPage() {
  favoriteRecipeIds = loadFavoriteRecipeIds();
  renderRecipesView();
}

function renderRecipesView() {
  stopTimer();

  const root = document.getElementById("recipesRoot");

  if (!root) {
    return;
  }

  if (viewMode === "cooking") {
    root.innerHTML = renderCookingMode();
    bindCookingEvents();
    runTimerTick();
    return;
  }

  if (viewMode === "detail") {
    root.innerHTML = renderRecipeDetails(getRecipeById(selectedRecipeId));
    bindRecipeDetailsEvents();
    return;
  }

  root.innerHTML = renderRecipeList();
  bindRecipeListEvents();
}

function renderRecipeList() {
  const visibleRecipes = getVisibleRecipes();
  const categories = getRecipeCategories();

  return `
    <div class="card recipe">
      <h3>Рецепти</h3>

      <div class="recipeFilters">
        <input id="recipeSearch" type="search" placeholder="Пошук рецептів..." value="${escapeHtml(searchQuery)}">
        <select id="recipeCategoryFilter" aria-label="Категорія">
          <option value="all"${selectedCategory === "all" ? " selected" : ""}>Усі</option>
          <option value="favorites"${selectedCategory === "favorites" ? " selected" : ""}>⭐ Обране</option>
          ${categories.map((category) => `
            <option value="${escapeHtml(category)}"${selectedCategory === category ? " selected" : ""}>${escapeHtml(category)}</option>
          `).join("")}
        </select>
      </div>

      <div class="recipeList" aria-label="Список рецептів">
        ${visibleRecipes.length ? visibleRecipes.map(renderRecipeListItem).join("") : '<p class="muted">Нічого не знайдено</p>'}
      </div>
    </div>
  `;
}

function renderRecipeListItem(recipe) {
  const isFavorite = favoriteRecipeIds.includes(recipe.id);

  return `
    <div class="recipeListRow">
      <button class="recipeListItem" type="button" data-recipe-id="${escapeHtml(recipe.id)}">
        ${escapeHtml(recipe.title)}
      </button>
      <button
        class="favoriteBtn${isFavorite ? " active" : ""}"
        type="button"
        data-action="toggle-favorite"
        data-recipe-id="${escapeHtml(recipe.id)}"
        aria-label="${isFavorite ? "Прибрати з обраного" : "Додати в обране"}"
        title="${isFavorite ? "Прибрати з обраного" : "Додати в обране"}"
      >
        ${isFavorite ? "★" : "☆"}
      </button>
    </div>
  `;
}

function renderRecipeDetails(recipe) {
  const selectedServings = getSelectedServings(recipe);

  return `
    <div class="card recipe">
      <button class="secondaryAction" type="button" data-action="back-to-recipes">Назад до списку</button>
      <h3>${escapeHtml(recipe.title)}</h3>

      <div class="recipeMeta">
        <span>${escapeHtml(recipe.category)}</span>
        <span>${escapeHtml(recipe.cookingTime)}</span>
      </div>

      <div class="servingsControl" aria-label="Порції">
        <button class="secondaryAction" type="button" data-action="decrease-servings" ${selectedServings <= 1 ? "disabled" : ""}>-</button>
        <span>${selectedServings} порції</span>
        <button class="secondaryAction" type="button" data-action="increase-servings">+</button>
      </div>

      <h4>Інгредієнти</h4>
      <ul>
        ${recipe.ingredients.map((ingredient) => `<li>${escapeHtml(formatIngredient(ingredient, recipe.baseServings, selectedServings))}</li>`).join("")}
      </ul>

      <h4>Кроки приготування</h4>
      <ol>
        ${recipe.steps.map((step) => `<li>${escapeHtml(step.title)}${step.timerSeconds ? ` - ${formatTime(step.timerSeconds)}` : ""}</li>`).join("")}
      </ol>

      <button class="action" type="button" data-action="start-cooking">Почати готувати</button>
    </div>
  `;
}

function renderCookingMode() {
  const recipe = getRecipeById(selectedRecipeId);
  const currentStep = recipe.steps[progress.currentStepIndex];
  const remainingSeconds = getRemainingSeconds(currentStep);
  const progressText = `Крок ${progress.currentStepIndex + 1} з ${recipe.steps.length}`;

  return `
    <div class="card recipe">
      <button class="secondaryAction" type="button" data-action="back-to-details">До рецепта</button>
      <p class="muted">${escapeHtml(recipe.title)}</p>
      <h3>${escapeHtml(currentStep.title)}</h3>
      <p class="muted">${progressText}</p>

      <div class="step cookingStep">
        <p>${escapeHtml(currentStep.text)}</p>
        ${currentStep.timerSeconds ? `
          <div class="timerBox">
            <span id="recipeTimer">${formatTime(remainingSeconds)}</span>
            <div class="timerActions">
              <button class="secondaryAction" type="button" data-action="start-timer" ${progress.isTimerRunning ? "disabled" : ""}>Старт</button>
              <button class="secondaryAction" type="button" data-action="pause-timer" ${!progress.isTimerRunning ? "disabled" : ""}>Пауза</button>
              <button class="secondaryAction" type="button" data-action="resume-timer" ${progress.isTimerRunning || !progress.isTimerPaused ? "disabled" : ""}>Продовжити</button>
              <button class="secondaryAction" type="button" data-action="reset-timer">Скинути</button>
            </div>
          </div>
        ` : `<p class="muted">Для цього кроку таймер не потрібен.</p>`}
      </div>

      <div class="recipeControls">
        <button class="secondaryAction" type="button" data-action="previous-step" ${progress.currentStepIndex === 0 ? "disabled" : ""}>Назад</button>
        <button class="action" type="button" data-action="next-step">
          ${progress.currentStepIndex === recipe.steps.length - 1 ? "Завершити" : "Далі"}
        </button>
      </div>
    </div>
  `;
}

function bindRecipeListEvents() {
  document.getElementById("recipeSearch").addEventListener("input", (event) => {
    searchQuery = event.target.value;
    updateRecipeResults();
  });

  document.getElementById("recipeCategoryFilter").addEventListener("change", (event) => {
    selectedCategory = event.target.value;
    updateRecipeResults();
  });

  bindRecipeResultEvents();
}

function bindRecipeResultEvents() {
  document.querySelectorAll(".recipeListItem").forEach((button) => {
    button.addEventListener("click", () => {
      selectedRecipeId = button.dataset.recipeId;
      viewMode = "detail";
      renderRecipesView();
    });
  });

  document.querySelectorAll('[data-action="toggle-favorite"]').forEach((button) => {
    button.addEventListener("click", () => {
      toggleFavorite(button.dataset.recipeId);
    });
  });
}

function bindRecipeDetailsEvents() {
  document.querySelector('[data-action="back-to-recipes"]').addEventListener("click", () => {
    viewMode = "list";
    renderRecipesView();
  });

  document.querySelector('[data-action="decrease-servings"]').addEventListener("click", () => {
    changeSelectedServings(-1);
  });

  document.querySelector('[data-action="increase-servings"]').addEventListener("click", () => {
    changeSelectedServings(1);
  });

  document.querySelector('[data-action="start-cooking"]').addEventListener("click", () => {
    const storedProgress = loadRecipeProgress(selectedRecipeId);
    progress = normalizeProgress(storedProgress, getRecipeById(selectedRecipeId));
    progress.isTimerRunning = false;
    viewMode = "cooking";
    saveCurrentProgress();
    renderRecipesView();
  });
}

function bindCookingEvents() {
  document.querySelector('[data-action="back-to-details"]').addEventListener("click", () => {
    saveCurrentProgress();
    viewMode = "detail";
    renderRecipesView();
  });

  document.querySelector('[data-action="previous-step"]').addEventListener("click", () => {
    if (progress.currentStepIndex === 0) {
      return;
    }

    progress.currentStepIndex -= 1;
    resetTimerForCurrentStep();
    saveCurrentProgress();
    renderRecipesView();
  });

  document.querySelector('[data-action="next-step"]').addEventListener("click", () => {
    const recipe = getRecipeById(selectedRecipeId);
    const currentStepIndex = progress.currentStepIndex;

    progress.completedSteps = Array.from(new Set([...progress.completedSteps, currentStepIndex]));

    if (currentStepIndex === recipe.steps.length - 1) {
      progress.currentStepIndex = 0;
      progress.remainingSeconds = null;
      progress.isTimerPaused = false;
      progress.isTimerRunning = false;
      progress.completedSteps = recipe.steps.map((_, index) => index);
      saveCurrentProgress();
      viewMode = "detail";
      renderRecipesView();
      return;
    }

    progress.currentStepIndex += 1;
    resetTimerForCurrentStep();
    saveCurrentProgress();
    renderRecipesView();
  });

  const startTimerButton = document.querySelector('[data-action="start-timer"]');
  const pauseTimerButton = document.querySelector('[data-action="pause-timer"]');
  const resumeTimerButton = document.querySelector('[data-action="resume-timer"]');
  const resetTimerButton = document.querySelector('[data-action="reset-timer"]');

  if (startTimerButton) {
    startTimerButton.addEventListener("click", () => {
      startTimerForCurrentStep();
    });
  }

  if (pauseTimerButton) {
    pauseTimerButton.addEventListener("click", () => {
      progress.isTimerRunning = false;
      progress.isTimerPaused = true;
      saveCurrentProgress();
      renderRecipesView();
    });
  }

  if (resumeTimerButton) {
    resumeTimerButton.addEventListener("click", () => {
      startTimerForCurrentStep();
    });
  }

  if (resetTimerButton) {
    resetTimerButton.addEventListener("click", () => {
      resetTimerForCurrentStep();
      saveCurrentProgress();
      renderRecipesView();
    });
  }
}

function startTimerForCurrentStep() {
  const currentStep = getRecipeById(selectedRecipeId).steps[progress.currentStepIndex];

  if (!currentStep.timerSeconds) {
    return;
  }

  if (progress.remainingSeconds === null) {
    progress.remainingSeconds = currentStep.timerSeconds;
  }

  if (progress.remainingSeconds <= 0) {
    return;
  }

  progress.isTimerRunning = true;
  progress.isTimerPaused = false;
  saveCurrentProgress();
  renderRecipesView();
}

function runTimerTick() {
  const currentStep = getRecipeById(selectedRecipeId).steps[progress.currentStepIndex];

  if (!currentStep.timerSeconds || !progress.isTimerRunning || progress.remainingSeconds <= 0) {
    return;
  }

  timerId = window.setInterval(() => {
    progress.remainingSeconds = Math.max(0, getRemainingSeconds(currentStep) - 1);
    saveCurrentProgress();

    const timerElement = document.getElementById("recipeTimer");

    if (timerElement) {
      timerElement.textContent = formatTime(progress.remainingSeconds);
    }

    if (progress.remainingSeconds === 0) {
      progress.isTimerRunning = false;
      progress.isTimerPaused = true;
      saveCurrentProgress();
      stopTimer();
      renderRecipesView();
    }
  }, 1000);
}

function resetTimerForCurrentStep() {
  const currentStep = getRecipeById(selectedRecipeId).steps[progress.currentStepIndex];
  progress.remainingSeconds = currentStep.timerSeconds || null;
  progress.isTimerPaused = false;
  progress.isTimerRunning = false;
}

function getRemainingSeconds(step) {
  if (!step.timerSeconds) {
    return 0;
  }

  return progress.remainingSeconds ?? step.timerSeconds;
}

function normalizeProgress(storedProgress, recipe) {
  const maxStepIndex = Math.max(recipe.steps.length - 1, 0);
  const currentStepIndex = Math.min(
    Math.max(Number(storedProgress?.currentStepIndex) || 0, 0),
    maxStepIndex
  );

  return {
    ...emptyProgress,
    ...storedProgress,
    currentStepIndex,
    isTimerRunning: false,
    completedSteps: Array.isArray(storedProgress?.completedSteps)
      ? storedProgress.completedSteps.filter((stepIndex) => stepIndex >= 0 && stepIndex <= maxStepIndex)
      : []
  };
}

function saveCurrentProgress() {
  saveRecipeProgress(selectedRecipeId, progress);
}

function stopTimer() {
  if (timerId) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function getSelectedServings(recipe) {
  return selectedServingsByRecipe[recipe.id] || recipe.baseServings;
}

function changeSelectedServings(change) {
  const recipe = getRecipeById(selectedRecipeId);
  const nextServings = Math.max(1, getSelectedServings(recipe) + change);

  selectedServingsByRecipe = {
    ...selectedServingsByRecipe,
    [recipe.id]: nextServings
  };

  renderRecipesView();
}

function formatIngredient(ingredient, baseServings, selectedServings) {
  if (ingredient.amount === null) {
    return ingredient.name;
  }

  const scale = selectedServings / baseServings;
  const amount = Array.isArray(ingredient.amount)
    ? ingredient.amount.map((value) => formatAmount(value * scale)).join("-")
    : formatAmount(ingredient.amount * scale);

  return `${amount} ${ingredient.unit} ${ingredient.name}`.trim();
}

function formatAmount(value) {
  const rounded = Math.round(value * 100) / 100;

  if (Number.isInteger(rounded)) {
    return String(rounded);
  }

  return String(rounded).replace(".", ",");
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getVisibleRecipes() {
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  return recipes.filter((recipe) => {
    const matchesSearch = !normalizedSearchQuery || recipe.title.toLowerCase().includes(normalizedSearchQuery);
    const matchesCategory = selectedCategory === "all"
      || recipe.category === selectedCategory
      || (selectedCategory === "favorites" && favoriteRecipeIds.includes(recipe.id));

    return matchesSearch && matchesCategory;
  });
}

function getRecipeCategories() {
  return Array.from(new Set(recipes.map((recipe) => recipe.category))).sort((a, b) => a.localeCompare(b, "uk"));
}

function toggleFavorite(recipeId) {
  favoriteRecipeIds = favoriteRecipeIds.includes(recipeId)
    ? favoriteRecipeIds.filter((id) => id !== recipeId)
    : [...favoriteRecipeIds, recipeId];

  saveFavoriteRecipeIds();
  updateRecipeResults();
}

function updateRecipeResults() {
  const recipeList = document.querySelector(".recipeList");
  const visibleRecipes = getVisibleRecipes();

  if (!recipeList) {
    return;
  }

  recipeList.innerHTML = visibleRecipes.length
    ? visibleRecipes.map(renderRecipeListItem).join("")
    : '<p class="muted">Нічого не знайдено</p>';

  bindRecipeResultEvents();
}

function loadFavoriteRecipeIds() {
  try {
    const storedRecipeIds = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");

    return Array.isArray(storedRecipeIds) ? storedRecipeIds : [];
  } catch {
    return [];
  }
}

function saveFavoriteRecipeIds() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteRecipeIds));
}
