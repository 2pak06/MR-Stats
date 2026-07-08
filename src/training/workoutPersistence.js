const ACTIVE_WORKOUT_KEY = "mr_training_active_workout";

export function saveActiveWorkoutState(activeWorkout) {
  if (!activeWorkout) {
    return;
  }

  localStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify({
    programId: activeWorkout.program.id,
    selectedExerciseIds: activeWorkout.program.exercises.map((exercise) => exercise.id),
    exerciseIndex: activeWorkout.exerciseIndex,
    stepIndex: activeWorkout.stepIndex,
    rest: activeWorkout.rest,
    completedSteps: activeWorkout.completedSteps || []
  }));
}

export function loadSavedActiveWorkoutState() {
  try {
    return JSON.parse(localStorage.getItem(ACTIVE_WORKOUT_KEY) || "null");
  } catch {
    return null;
  }
}

export function clearSavedActiveWorkout() {
  localStorage.removeItem(ACTIVE_WORKOUT_KEY);
}
