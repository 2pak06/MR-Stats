import {
  createProgramExercise,
  createWorkoutProgram,
  loadWorkoutPrograms,
  saveWorkoutPrograms
} from "./programStorage.js";
import { escapeAttribute, formatWeight } from "./workoutFormat.js";
import {
  backToWorkoutStep as buildWorkoutBackState,
  buildConfirmedWorkoutState,
  calculateNextWorkoutState,
  createActiveWorkout,
  createWorkoutStepConfirmation,
  getCurrentExercise,
  getExerciseMode,
  restoreActiveWorkout,
  toNumber
} from "./workoutEngine.js";
import {
  clearSavedActiveWorkout,
  loadSavedActiveWorkoutState,
  saveActiveWorkoutState as persistActiveWorkoutState
} from "./workoutPersistence.js";
import {
  renderActiveWorkout,
  renderSavedWorkoutPrompt
} from "./workoutRenderer.js";
import {
  startRestCountdown,
  startRestTimer,
  stopRestTimer
} from "./workoutTimer.js";

let isCreateProgramFormOpen = false;
let savedWorkoutState = loadSavedActiveWorkoutState();
let restoreMessage = "";
let activeWorkout = null;

document.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof Element)) {
    return;
  }

  const actionElement = target.closest("[data-training-action]");

  if (!actionElement) {
    return;
  }

  const action = actionElement.dataset.trainingAction;

  if (action === "open-create-program") {
    isCreateProgramFormOpen = true;
    refreshTrainingContent();
    focusCreateProgramInput();
  }

  if (action === "cancel-create-program") {
    isCreateProgramFormOpen = false;
    refreshTrainingContent();
  }

  if (action === "save-program") {
    saveNewProgram();
  }

  if (action === "delete-program") {
    deleteProgram(actionElement.dataset.programId);
  }

  if (action === "start-program") {
    startWorkout(actionElement.dataset.programId);
  }

  if (action === "continue-workout") {
    continueSavedWorkout();
  }

  if (action === "reset-saved-workout") {
    resetSavedWorkout();
  }

  if (action === "complete-workout-step") {
    completeWorkoutStep();
  }

  if (action === "confirm-workout-step") {
    saveConfirmedWorkoutStep(false);
  }

  if (action === "fail-workout-step") {
    saveConfirmedWorkoutStep(true);
  }

  if (action === "back-to-workout-step") {
    backToWorkoutStep();
  }

  if (action === "skip-rest") {
    finishRestAndAdvance();
  }

  if (action === "cancel-workout") {
    stopRestTimer();
    activeWorkout = null;
    clearSavedActiveWorkout();
    refreshTrainingContent();
  }

  if (action === "add-exercise") {
    addExercise(actionElement.dataset.programId);
  }

  if (action === "remove-exercise") {
    removeExercise(actionElement.dataset.programId, actionElement.dataset.exerciseId);
  }
});

document.addEventListener("input", handleTrainingFieldChange);
document.addEventListener("change", handleTrainingFieldChange);

function handleTrainingFieldChange(event) {
  const fieldElement = event.target;

  if (
    !(fieldElement instanceof HTMLInputElement) &&
    !(fieldElement instanceof HTMLSelectElement)
  ) {
    return;
  }

  if (!fieldElement.matches("[data-training-field]")) {
    return;
  }

  updateProgramField(fieldElement);

  if (fieldElement.dataset.trainingField === "exercise-mode") {
    refreshTrainingContent();
  }
}

export function renderTrainingPage() {
  return `
    <section class="page" id="training">
      <div class="trainingIntro card">
        <h3>💪 Тренування</h3>
        <p class="muted">Створюй програми, запускай тренування, підтверджуй підходи та повертайся до незавершеного заняття після перезапуску.</p>
      </div>
      <div id="trainingContent">
        ${renderTrainingContent()}
      </div>
    </section>
  `;
}

function renderTrainingContent() {
  if (activeWorkout) {
    return renderActiveWorkout(activeWorkout);
  }

  if (savedWorkoutState || restoreMessage) {
    return renderSavedWorkoutPrompt(savedWorkoutState, restoreMessage);
  }

  return `
    <div class="grid">
      ${renderProgramsSection()}
    </div>
  `;
}

function renderProgramsSection() {
  const programs = loadWorkoutPrograms();

  return `
    <div class="card">
      <h3>Програми</h3>
      <button class="action" type="button" data-training-action="open-create-program">Створити програму</button>
      <br><br>
      ${isCreateProgramFormOpen ? renderCreateProgramForm() : ""}
      ${programs.length ? programs.map(renderProgram).join("") : '<p class="muted">Поки немає програм тренувань.</p>'}
    </div>
  `;
}

function renderCreateProgramForm() {
  return `
    <div class="step">
      <label>
        <span class="muted">Назва програми</span>
        <input id="newProgramName" type="text" placeholder="Наприклад: Тренування вдома">
      </label>
      <button class="action" type="button" data-training-action="save-program">Зберегти програму</button>
      <button class="secondaryAction" type="button" data-training-action="cancel-create-program">Скасувати</button>
    </div>
  `;
}

function renderProgram(program) {
  return `
    <div class="step">
      <label>
        <span class="muted">Назва програми</span>
        <input
          type="text"
          value="${escapeAttribute(program.name)}"
          data-training-field="program-name"
          data-program-id="${program.id}"
        >
      </label>

      <h4>Вправи</h4>
      ${program.exercises.length ? program.exercises.map((exercise) => renderExercise(program.id, exercise)).join("") : '<p class="muted">Додай першу вправу до програми.</p>'}

      <button class="secondaryAction" type="button" data-training-action="add-exercise" data-program-id="${program.id}">
        Додати вправу
      </button>
      <button class="secondaryAction" type="button" data-training-action="delete-program" data-program-id="${program.id}">
        Видалити програму
      </button>
      <button
        class="action"
        type="button"
        data-training-action="start-program"
        data-program-id="${program.id}"
        ${program.exercises.length ? "" : "disabled"}
      >
        Почати тренування
      </button>
    </div>
  `;
}

function renderLegacyExercise(programId, exercise) {
  return `
    <div class="step">
      <label>
        <span class="muted">Назва вправи</span>
        <input
          type="text"
          value="${escapeAttribute(exercise.name)}"
          data-training-field="exercise-name"
          data-program-id="${programId}"
          data-exercise-id="${exercise.id}"
        >
      </label>
      <label>
        <span class="muted">Підходи</span>
        <input
          type="number"
          min="1"
          value="${exercise.sets}"
          data-training-field="exercise-sets"
          data-program-id="${programId}"
          data-exercise-id="${exercise.id}"
        >
      </label>
      <label>
        <span class="muted">Повторення</span>
        <input
          type="number"
          min="1"
          value="${exercise.reps}"
          data-training-field="exercise-reps"
          data-program-id="${programId}"
          data-exercise-id="${exercise.id}"
        >
      </label>
      <label>
        <span class="muted">Вага, кг</span>
        <input
          type="number"
          min="0"
          step="0.5"
          value="${exercise.weight}"
          data-training-field="exercise-weight"
          data-program-id="${programId}"
          data-exercise-id="${exercise.id}"
        >
      </label>
      <label>
        <span class="muted">Відпочинок, сек</span>
        <input
          type="number"
          min="0"
          value="${exercise.restTime}"
          data-training-field="exercise-rest"
          data-program-id="${programId}"
          data-exercise-id="${exercise.id}"
        >
      </label>
      <button
        class="secondaryAction"
        type="button"
        data-training-action="remove-exercise"
        data-program-id="${programId}"
        data-exercise-id="${exercise.id}"
      >
        Прибрати вправу
      </button>
    </div>
  `;
}

function renderExercise(programId, exercise) {
  const mode = getExerciseMode(exercise);

  return `
    <div class="step">
      <label>
        <span class="muted">Назва вправи</span>
        <input
          type="text"
          value="${escapeAttribute(exercise.name)}"
          data-training-field="exercise-name"
          data-program-id="${programId}"
          data-exercise-id="${exercise.id}"
        >
      </label>
      <label>
        <span class="muted">Режим</span>
        <select
          data-training-field="exercise-mode"
          data-program-id="${programId}"
          data-exercise-id="${exercise.id}"
        >
          <option value="sets" ${mode === "sets" ? "selected" : ""}>Підходи</option>
          <option value="ladder" ${mode === "ladder" ? "selected" : ""}>Сходинка</option>
        </select>
      </label>
      <p class="muted">${renderExerciseSummary(exercise)}</p>
      ${mode === "sets" ? renderSetsExerciseFields(programId, exercise) : renderLadderExerciseFields(programId, exercise)}
      <button
        class="secondaryAction"
        type="button"
        data-training-action="remove-exercise"
        data-program-id="${programId}"
        data-exercise-id="${exercise.id}"
      >
        Прибрати вправу
      </button>
    </div>
  `;
}

function renderSetsExerciseFields(programId, exercise) {
  return `
      <label>
        <span class="muted">Підходи</span>
        <input
          type="number"
          min="1"
          value="${exercise.sets}"
          data-training-field="exercise-sets"
          data-program-id="${programId}"
          data-exercise-id="${exercise.id}"
        >
      </label>
      <label>
        <span class="muted">Повторення</span>
        <input
          type="number"
          min="1"
          value="${exercise.reps}"
          data-training-field="exercise-reps"
          data-program-id="${programId}"
          data-exercise-id="${exercise.id}"
        >
      </label>
      ${renderSharedExerciseFields(programId, exercise)}
  `;
}

function renderLadderExerciseFields(programId, exercise) {
  return `
      <label>
        <span class="muted">Від</span>
        <input
          type="number"
          min="1"
          value="${exercise.ladderFrom ?? 1}"
          data-training-field="exercise-ladder-from"
          data-program-id="${programId}"
          data-exercise-id="${exercise.id}"
        >
      </label>
      <label>
        <span class="muted">До</span>
        <input
          type="number"
          min="1"
          value="${exercise.ladderTo ?? 5}"
          data-training-field="exercise-ladder-to"
          data-program-id="${programId}"
          data-exercise-id="${exercise.id}"
        >
      </label>
      ${renderSharedExerciseFields(programId, exercise)}
  `;
}

function renderSharedExerciseFields(programId, exercise) {
  return `
      <label>
        <span class="muted">Вага, кг</span>
        <input
          type="number"
          min="0"
          step="0.5"
          value="${exercise.weight}"
          data-training-field="exercise-weight"
          data-program-id="${programId}"
          data-exercise-id="${exercise.id}"
        >
      </label>
      <label>
        <span class="muted">Відпочинок, с</span>
        <input
          type="number"
          min="0"
          value="${exercise.restTime}"
          data-training-field="exercise-rest"
          data-program-id="${programId}"
          data-exercise-id="${exercise.id}"
        >
      </label>
  `;
}

function saveNewProgram() {
  const nameInput = document.getElementById("newProgramName");
  const programName = nameInput?.value.trim();

  if (!programName) {
    nameInput?.focus();
    return;
  }

  const programs = loadWorkoutPrograms();
  saveWorkoutPrograms([...programs, createWorkoutProgram(programName)]);
  isCreateProgramFormOpen = false;
  refreshTrainingContent();
}

function deleteProgram(programId) {
  const programs = loadWorkoutPrograms().filter((program) => program.id !== programId);

  saveWorkoutPrograms(programs);
  refreshTrainingContent();
}

function addExercise(programId) {
  const programs = loadWorkoutPrograms().map((program) => {
    if (program.id !== programId) {
      return program;
    }

    return {
      ...program,
      exercises: [...program.exercises, createProgramExercise()]
    };
  });

  saveWorkoutPrograms(programs);
  refreshTrainingContent();
}

function removeExercise(programId, exerciseId) {
  const programs = loadWorkoutPrograms().map((program) => {
    if (program.id !== programId) {
      return program;
    }

    return {
      ...program,
      exercises: program.exercises.filter((exercise) => exercise.id !== exerciseId)
    };
  });

  saveWorkoutPrograms(programs);
  refreshTrainingContent();
}

function startWorkout(programId) {
  stopRestTimer();
  const program = loadWorkoutPrograms().find((item) => item.id === programId);

  if (!program || !program.exercises.length) {
    return;
  }

  activeWorkout = createActiveWorkout(program);
  savedWorkoutState = null;
  restoreMessage = "";
  saveActiveWorkoutState();
  refreshTrainingContent();
}

function continueSavedWorkout() {
  if (!savedWorkoutState) {
    return;
  }

  const program = loadWorkoutPrograms().find((item) => item.id === savedWorkoutState.programId);

  if (!program) {
    stopRestTimer();
    activeWorkout = null;
    savedWorkoutState = null;
    restoreMessage = "Програму видалено. Тренування не відновлено.";
    clearSavedActiveWorkout();
    refreshTrainingContent();
    return;
  }

  activeWorkout = restoreActiveWorkout(program, savedWorkoutState);
  savedWorkoutState = null;
  restoreMessage = "";
  saveActiveWorkoutState();
  refreshTrainingContent();

  if (activeWorkout.rest) {
    startRestCountdown(getTrainingContext());
  }
}

function resetSavedWorkout() {
  stopRestTimer();
  activeWorkout = null;
  savedWorkoutState = null;
  restoreMessage = "";
  clearSavedActiveWorkout();
  refreshTrainingContent();
}

function completeWorkoutStep() {
  if (!activeWorkout) {
    return;
  }

  const currentExercise = getCurrentExercise(activeWorkout);

  if (!currentExercise) {
    clearSavedActiveWorkout();
    refreshTrainingContent();
    return;
  }

  activeWorkout = createWorkoutStepConfirmation(activeWorkout);
  refreshTrainingContent();
}

function saveConfirmedWorkoutStep(failed) {
  if (!activeWorkout) {
    return;
  }

  const currentExercise = getCurrentExercise(activeWorkout);

  if (!currentExercise) {
    clearSavedActiveWorkout();
    refreshTrainingContent();
    return;
  }

  const repsInput = document.getElementById("confirmedStepReps");
  const weightInput = document.getElementById("confirmedStepWeight");

  activeWorkout = buildConfirmedWorkoutState(
    activeWorkout,
    failed,
    repsInput?.value,
    weightInput?.value
  );

  saveActiveWorkoutState();
  startRestTimer(currentExercise, getTrainingContext());
}

function backToWorkoutStep() {
  if (!activeWorkout) {
    return;
  }

  activeWorkout = buildWorkoutBackState(activeWorkout);
  refreshTrainingContent();
}

function finishRestAndAdvance() {
  if (!activeWorkout) {
    stopRestTimer();
    return;
  }

  stopRestTimer();
  advanceActiveWorkoutStep();
  saveActiveWorkoutState();
}

function advanceActiveWorkoutStep() {
  if (!activeWorkout) {
    return;
  }

  const result = calculateNextWorkoutState(activeWorkout);
  activeWorkout = result.activeWorkout;

  if (result.shouldClearSavedWorkout) {
    clearSavedActiveWorkout();
  } else {
    saveActiveWorkoutState();
  }

  refreshTrainingContent();
}

function saveActiveWorkoutState() {
  persistActiveWorkoutState(activeWorkout);
}

function getTrainingContext() {
  return {
    getActiveWorkout: () => activeWorkout,
    setActiveWorkout: (nextActiveWorkout) => {
      activeWorkout = nextActiveWorkout;
    },
    refreshTrainingContent,
    saveActiveWorkoutState,
    finishRestAndAdvance
  };
}

function updateProgramField(input) {
  const programs = loadWorkoutPrograms().map((program) => {
    if (program.id !== input.dataset.programId) {
      return program;
    }

    if (input.dataset.trainingField === "program-name") {
      return {
        ...program,
        name: input.value
      };
    }

    return {
      ...program,
      exercises: program.exercises.map((exercise) => updateExerciseField(exercise, input))
    };
  });

  saveWorkoutPrograms(programs);
}

function updateExerciseField(exercise, input) {
  if (exercise.id !== input.dataset.exerciseId) {
    return exercise;
  }

  const field = input.dataset.trainingField;

  if (field === "exercise-name") {
    return { ...exercise, name: input.value };
  }

  if (field === "exercise-mode") {
    if (input.value === "ladder") {
      return {
        ...exercise,
        mode: "ladder",
        ladderFrom: exercise.ladderFrom ?? 1,
        ladderTo: exercise.ladderTo ?? 5
      };
    }

    return { ...exercise, mode: "sets" };
  }

  if (field === "exercise-sets") {
    return { ...exercise, sets: toNumber(input.value, 1) };
  }

  if (field === "exercise-reps") {
    return { ...exercise, reps: toNumber(input.value, 1) };
  }

  if (field === "exercise-weight") {
    return { ...exercise, weight: input.value };
  }

  if (field === "exercise-rest") {
    return { ...exercise, restTime: toNumber(input.value, 0) };
  }

  if (field === "exercise-ladder-from") {
    return { ...exercise, ladderFrom: toNumber(input.value, 1) };
  }

  if (field === "exercise-ladder-to") {
    return { ...exercise, ladderTo: toNumber(input.value, 1) };
  }

  return exercise;
}

function renderExerciseSummary(exercise) {
  if (getExerciseMode(exercise) === "ladder") {
    return `Сходинка: ${exercise.ladderFrom ?? 1} → ${exercise.ladderTo ?? 5} • ${formatWeight(exercise.weight)} • ${exercise.restTime} с`;
  }

  return `Підходи: ${exercise.sets} × ${exercise.reps} • ${formatWeight(exercise.weight)} • ${exercise.restTime} с`;
}

function refreshTrainingContent() {
  const trainingContent = document.getElementById("trainingContent");

  if (!trainingContent) {
    return;
  }

  trainingContent.innerHTML = renderTrainingContent();
}

function focusCreateProgramInput() {
  requestAnimationFrame(() => {
    document.getElementById("newProgramName")?.focus();
  });
}
