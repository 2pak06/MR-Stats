import { getExerciseById, programs } from "./exerciseDatabase.js";

const WORKOUT_SESSION_KEY = "mr_training_session";

export function loadWorkoutSession() {
  return readJson(WORKOUT_SESSION_KEY, null);
}

export function saveWorkoutSession(session) {
  localStorage.setItem(WORKOUT_SESSION_KEY, JSON.stringify(session));
}

export function clearWorkoutSession() {
  localStorage.removeItem(WORKOUT_SESSION_KEY);
}

export function createWorkoutSession(programId = programs[0].id) {
  const program = programs.find((item) => item.id === programId) || programs[0];
  const exercises = program.exerciseIds
    .map(getExerciseById)
    .filter(Boolean)
    .map((exercise) => ({
      exerciseId: exercise.id,
      name: exercise.name,
      sets: exercise.defaultSets,
      reps: exercise.defaultReps,
      weight: "",
      completed: false
    }));

  return {
    id: `training_${Date.now()}`,
    programId: program.id,
    programName: program.name,
    startedAt: new Date().toISOString(),
    exercises
  };
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}
