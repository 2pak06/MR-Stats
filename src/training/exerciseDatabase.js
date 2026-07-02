export const exercises = [
  {
    id: "push-ups",
    name: "Віджимання",
    category: "Власна вага",
    target: "Груди, плечі, трицепс",
    defaultSets: 3,
    defaultReps: 10
  },
  {
    id: "squats",
    name: "Присідання",
    category: "Власна вага",
    target: "Ноги, сідниці",
    defaultSets: 3,
    defaultReps: 15
  },
  {
    id: "plank",
    name: "Планка",
    category: "Кор",
    target: "Прес, спина",
    defaultSets: 3,
    defaultReps: 30
  },
  {
    id: "dumbbell-press",
    name: "Жим гантелей",
    category: "Гантелі",
    target: "Груди, плечі",
    defaultSets: 3,
    defaultReps: 10
  },
  {
    id: "dumbbell-row",
    name: "Тяга гантелі",
    category: "Гантелі",
    target: "Спина, біцепс",
    defaultSets: 3,
    defaultReps: 10
  },
  {
    id: "step-ups",
    name: "Підйоми на сходинку",
    category: "Кардіо",
    target: "Ноги, витривалість",
    defaultSets: 3,
    defaultReps: 20
  }
];

export const programs = [
  {
    id: "beginner-full-body",
    name: "Базове тренування",
    description: "Простий старт для всього тіла без складного обладнання.",
    exerciseIds: ["push-ups", "squats", "plank", "step-ups"]
  },
  {
    id: "dumbbell-basic",
    name: "Гантелі базово",
    description: "Коротка програма з гантелями для верху тіла.",
    exerciseIds: ["dumbbell-press", "dumbbell-row", "squats"]
  }
];

export function getExerciseById(exerciseId) {
  return exercises.find((exercise) => exercise.id === exerciseId);
}
