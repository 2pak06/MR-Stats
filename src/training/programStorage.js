const WORKOUT_PROGRAMS_KEY = "mr_training_programs";

export function loadWorkoutPrograms() {
  return readJson(WORKOUT_PROGRAMS_KEY, []);
}

export function saveWorkoutPrograms(programs) {
  localStorage.setItem(WORKOUT_PROGRAMS_KEY, JSON.stringify(programs));
}

export function createWorkoutProgram(name) {
  return {
    id: `program_${Date.now()}`,
    name: name.trim(),
    exercises: []
  };
}

export function createProgramExercise() {
  return {
    id: `exercise_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    name: "Нова вправа",
    mode: "sets",
    sets: 3,
    reps: 10,
    weight: "",
    restTime: 60
  };
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}
