import { escapeAttribute, escapeHtml, formatWeight } from "./workoutFormat.js";
import {
  getCurrentExercise,
  getCurrentWorkoutStep,
  getExerciseMode
} from "./workoutEngine.js";

export function renderSavedWorkoutPrompt(savedWorkoutState, restoreMessage) {
  return `
    <div class="card">
      <h3>Тренування</h3>
      ${restoreMessage ? `<p class="muted">${escapeHtml(restoreMessage)}</p>` : '<p class="muted">Є незавершене тренування.</p>'}
      ${savedWorkoutState ? `
        <button class="action" type="button" data-training-action="continue-workout">
          Продовжити тренування
        </button>
        <button class="secondaryAction" type="button" data-training-action="reset-saved-workout">
          Скинути тренування
        </button>
      ` : ""}
    </div>
  `;
}

export function renderActiveWorkout(activeWorkout) {
  const currentExercise = getCurrentExercise(activeWorkout);

  if (activeWorkout.confirmation) {
    return renderWorkoutStepConfirmation(activeWorkout, currentExercise);
  }

  if (activeWorkout.rest) {
    return renderWorkoutRest(activeWorkout);
  }

  if (!currentExercise) {
    return `
      <div class="card">
        <h3>Тренування завершено</h3>
        <button class="action" type="button" data-training-action="cancel-workout">
          Повернутися до програм
        </button>
      </div>
    `;
  }

  const mode = getExerciseMode(currentExercise);
  const currentStep = getCurrentWorkoutStep(currentExercise, activeWorkout.stepIndex);
  const stepLabel = mode === "ladder" ? "Сходинка" : "Підхід";

  return `
    <div class="card">
      <h3>${escapeHtml(activeWorkout.program.name)}</h3>
      <div class="step">
        <p class="muted">Поточна вправа</p>
        <h4>${escapeHtml(currentExercise.name)}</h4>
        <p>Режим: ${mode === "ladder" ? "Сходинка" : "Підходи"}</p>
        <p>${stepLabel}: ${currentStep.position} з ${currentStep.total}</p>
        <p>Повторення: ${currentStep.reps}</p>
        <p>Вага: ${formatWeight(currentExercise.weight)}</p>
        <p>Відпочинок: ${currentExercise.restTime} с</p>
        <button class="action" type="button" data-training-action="complete-workout-step">
          Виконано
        </button>
        <button class="secondaryAction" type="button" data-training-action="cancel-workout">
          Скасувати тренування
        </button>
      </div>
    </div>
  `;
}

function renderWorkoutStepConfirmation(activeWorkout, exercise) {
  const confirmation = activeWorkout.confirmation;

  return `
    <div class="card">
      <h3>Підтвердження підходу</h3>
      <div class="step">
        <p class="muted">Вправа</p>
        <h4>${escapeHtml(exercise.name)}</h4>
        <p>${confirmation.stepLabel}: ${confirmation.position} з ${confirmation.total}</p>
        <label>
          <span class="muted">Повторення</span>
          <input id="confirmedStepReps" type="number" min="0" value="${confirmation.reps}">
        </label>
        <label>
          <span class="muted">Вага</span>
          <input id="confirmedStepWeight" type="number" min="0" step="0.5" value="${escapeAttribute(confirmation.weight)}">
        </label>
        <button class="action" type="button" data-training-action="confirm-workout-step">
          Підтвердити
        </button>
        <button class="secondaryAction" type="button" data-training-action="fail-workout-step">
          Не виконав
        </button>
        <button class="secondaryAction" type="button" data-training-action="back-to-workout-step">
          Назад
        </button>
      </div>
    </div>
  `;
}

function renderWorkoutRest(activeWorkout) {
  return `
    <div class="card">
      <h3>${escapeHtml(activeWorkout.rest.exerciseName)}</h3>
      <div class="step">
        <p class="muted">Відпочинок</p>
        <h4>${activeWorkout.rest.secondsLeft} с</h4>
        <button class="action" type="button" data-training-action="skip-rest">
          Пропустити
        </button>
        <button class="secondaryAction" type="button" data-training-action="cancel-workout">
          Скасувати тренування
        </button>
      </div>
    </div>
  `;
}
