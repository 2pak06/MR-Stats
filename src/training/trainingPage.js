import {
  createProgramExercise,
  createWorkoutProgram,
  loadWorkoutPrograms,
  saveWorkoutPrograms
} from "./programStorage.js";

const ACTIVE_WORKOUT_KEY = "mr_training_active_workout";

let isCreateProgramFormOpen = false;
let savedWorkoutState = loadSavedActiveWorkoutState();
let restoreMessage = "";
let activeWorkout = null;
let restTimerId = null;

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
      <div id="trainingContent">
        ${renderTrainingContent()}
      </div>
    </section>
  `;
}

function renderTrainingContent() {
  if (activeWorkout) {
    return renderActiveWorkout();
  }

  if (savedWorkoutState || restoreMessage) {
    return renderSavedWorkoutPrompt();
  }

  return `
    <div class="grid">
      ${renderStartWorkoutSection()}
      ${renderProgramsSection()}
    </div>
  `;
}

function renderSavedWorkoutPrompt() {
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

function renderStartWorkoutSection() {
  return `
    <div class="card">
      <h3>Старт тренування</h3>
      <p class="muted">Кнопка підготовлена для наступного етапу. Логіка тренування ще не запускається.</p>
      <button class="action" type="button">Почати тренування</button>
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

function renderActiveWorkout() {
  const currentExercise = activeWorkout.program.exercises[activeWorkout.exerciseIndex];

  if (activeWorkout.rest) {
    return renderWorkoutRest();
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

function renderWorkoutRest() {
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

  activeWorkout = {
    program,
    exerciseIndex: 0,
    stepIndex: 0,
    rest: null
  };

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

  activeWorkout = {
    program,
    exerciseIndex: savedWorkoutState.exerciseIndex,
    stepIndex: savedWorkoutState.stepIndex,
    rest: savedWorkoutState.rest
  };
  savedWorkoutState = null;
  restoreMessage = "";
  saveActiveWorkoutState();
  refreshTrainingContent();

  if (activeWorkout.rest) {
    startRestCountdown();
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

  const currentExercise = activeWorkout.program.exercises[activeWorkout.exerciseIndex];

  if (!currentExercise) {
    clearSavedActiveWorkout();
    refreshTrainingContent();
    return;
  }

  startRestTimer(currentExercise);
}

function startRestTimer(exercise) {
  stopRestTimer();

  if (!activeWorkout) {
    return;
  }

  activeWorkout = {
    ...activeWorkout,
    rest: {
      exerciseName: exercise.name,
      secondsLeft: Math.max(0, toNumber(exercise.restTime, 0))
    }
  };

  refreshTrainingContent();
  saveActiveWorkoutState();

  if (activeWorkout.rest.secondsLeft <= 0) {
    restTimerId = window.setTimeout(finishRestAndAdvance, 0);
    return;
  }

  startRestCountdown();
}

function startRestCountdown() {
  stopRestTimer();

  if (!activeWorkout?.rest) {
    return;
  }

  restTimerId = window.setInterval(() => {
    if (!activeWorkout?.rest) {
      stopRestTimer();
      return;
    }

    const secondsLeft = Math.max(0, activeWorkout.rest.secondsLeft - 1);

    activeWorkout = {
      ...activeWorkout,
      rest: {
        ...activeWorkout.rest,
        secondsLeft
      }
    };

    refreshTrainingContent();
    saveActiveWorkoutState();

    if (secondsLeft <= 0) {
      finishRestAndAdvance();
    }
  }, 1000);
}

function finishRestAndAdvance() {
  if (!activeWorkout) {
    stopRestTimer();
    return;
  }

  stopRestTimer();
  advanceWorkoutStep();
  saveActiveWorkoutState();
}

function advanceWorkoutStep() {
  if (!activeWorkout) {
    return;
  }

  const currentExercise = activeWorkout.program.exercises[activeWorkout.exerciseIndex];

  if (!currentExercise) {
    activeWorkout = {
      ...activeWorkout,
      rest: null
    };
    clearSavedActiveWorkout();
    refreshTrainingContent();
    return;
  }

  const totalSteps = getWorkoutStepCount(currentExercise);
  const nextStepIndex = activeWorkout.stepIndex + 1;

  if (nextStepIndex < totalSteps) {
    activeWorkout = {
      ...activeWorkout,
      stepIndex: nextStepIndex,
      rest: null
    };
    saveActiveWorkoutState();
    refreshTrainingContent();
    return;
  }

  const nextExerciseIndex = activeWorkout.exerciseIndex + 1;

  activeWorkout = {
    ...activeWorkout,
    exerciseIndex: nextExerciseIndex,
    stepIndex: 0,
    rest: null
  };

  if (nextExerciseIndex >= activeWorkout.program.exercises.length) {
    clearSavedActiveWorkout();
  } else {
    saveActiveWorkoutState();
  }

  refreshTrainingContent();
}

function stopRestTimer() {
  if (!restTimerId) {
    return;
  }

  window.clearInterval(restTimerId);
  window.clearTimeout(restTimerId);
  restTimerId = null;
}

function saveActiveWorkoutState() {
  if (!activeWorkout) {
    return;
  }

  localStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify({
    programId: activeWorkout.program.id,
    exerciseIndex: activeWorkout.exerciseIndex,
    stepIndex: activeWorkout.stepIndex,
    rest: activeWorkout.rest
  }));
}

function loadSavedActiveWorkoutState() {
  try {
    return JSON.parse(localStorage.getItem(ACTIVE_WORKOUT_KEY) || "null");
  } catch {
    return null;
  }
}

function clearSavedActiveWorkout() {
  localStorage.removeItem(ACTIVE_WORKOUT_KEY);
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

function getExerciseMode(exercise) {
  return exercise.mode || "sets";
}

function getWorkoutStepCount(exercise) {
  if (getExerciseMode(exercise) === "ladder") {
    const from = toNumber(exercise.ladderFrom, 1);
    const to = toNumber(exercise.ladderTo, from);

    return Math.abs(to - from) + 1;
  }

  return Math.max(1, toNumber(exercise.sets, 1));
}

function getCurrentWorkoutStep(exercise, stepIndex) {
  if (getExerciseMode(exercise) === "ladder") {
    const from = toNumber(exercise.ladderFrom, 1);
    const to = toNumber(exercise.ladderTo, from);
    const direction = to >= from ? 1 : -1;

    return {
      position: stepIndex + 1,
      total: getWorkoutStepCount(exercise),
      reps: from + stepIndex * direction
    };
  }

  return {
    position: stepIndex + 1,
    total: getWorkoutStepCount(exercise),
    reps: toNumber(exercise.reps, 1)
  };
}

function renderExerciseSummary(exercise) {
  if (getExerciseMode(exercise) === "ladder") {
    return `Сходинка: ${exercise.ladderFrom ?? 1} → ${exercise.ladderTo ?? 5} • ${formatWeight(exercise.weight)} • ${exercise.restTime} с`;
  }

  return `Підходи: ${exercise.sets} × ${exercise.reps} • ${formatWeight(exercise.weight)} • ${exercise.restTime} с`;
}

function formatWeight(weight) {
  return weight === "" ? "0 кг" : `${weight} кг`;
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

function toNumber(value, fallback) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
