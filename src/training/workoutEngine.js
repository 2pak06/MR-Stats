export function createActiveWorkout(program) {
  return {
    program,
    exerciseIndex: 0,
    stepIndex: 0,
    rest: null,
    confirmation: null,
    completedSteps: []
  };
}

export function restoreActiveWorkout(program, savedWorkoutState) {
  return {
    program,
    exerciseIndex: savedWorkoutState.exerciseIndex,
    stepIndex: savedWorkoutState.stepIndex,
    rest: savedWorkoutState.rest,
    confirmation: null,
    completedSteps: savedWorkoutState.completedSteps || []
  };
}

export function createWorkoutStepConfirmation(activeWorkout) {
  const currentExercise = getCurrentExercise(activeWorkout);
  const mode = getExerciseMode(currentExercise);
  const currentStep = getCurrentWorkoutStep(currentExercise, activeWorkout.stepIndex);

  return {
    ...activeWorkout,
    confirmation: {
      stepLabel: mode === "ladder" ? "Сходинка" : "Підхід",
      position: currentStep.position,
      total: currentStep.total,
      reps: currentStep.reps,
      weight: currentExercise.weight
    }
  };
}

export function buildConfirmedWorkoutState(activeWorkout, failed, repsValue, weightValue) {
  const currentExercise = getCurrentExercise(activeWorkout);
  const currentStep = getCurrentWorkoutStep(currentExercise, activeWorkout.stepIndex);

  return {
    ...activeWorkout,
    confirmation: null,
    completedSteps: [
      ...(activeWorkout.completedSteps || []),
      {
        exerciseIndex: activeWorkout.exerciseIndex,
        stepIndex: activeWorkout.stepIndex,
        exerciseName: currentExercise.name,
        mode: getExerciseMode(currentExercise),
        position: currentStep.position,
        reps: toNumber(repsValue, currentStep.reps),
        weight: toNumber(weightValue, toNumber(currentExercise.weight, 0)),
        failed
      }
    ]
  };
}

export function backToWorkoutStep(activeWorkout) {
  if (!activeWorkout) {
    return activeWorkout;
  }

  return {
    ...activeWorkout,
    confirmation: null
  };
}

export function calculateNextWorkoutState(activeWorkout) {
  const currentExercise = getCurrentExercise(activeWorkout);

  if (!currentExercise) {
    return {
      activeWorkout: {
        ...activeWorkout,
        rest: null
      },
      shouldClearSavedWorkout: true
    };
  }

  const totalSteps = getWorkoutStepCount(currentExercise);
  const nextStepIndex = activeWorkout.stepIndex + 1;

  if (nextStepIndex < totalSteps) {
    return {
      activeWorkout: {
        ...activeWorkout,
        stepIndex: nextStepIndex,
        rest: null
      },
      shouldClearSavedWorkout: false
    };
  }

  const nextExerciseIndex = activeWorkout.exerciseIndex + 1;

  return {
    activeWorkout: {
      ...activeWorkout,
      exerciseIndex: nextExerciseIndex,
      stepIndex: 0,
      rest: null
    },
    shouldClearSavedWorkout: nextExerciseIndex >= activeWorkout.program.exercises.length
  };
}

export function getCurrentExercise(activeWorkout) {
  return activeWorkout?.program.exercises[activeWorkout.exerciseIndex];
}

export function getExerciseMode(exercise) {
  return exercise.mode || "sets";
}

export function getWorkoutStepCount(exercise) {
  if (getExerciseMode(exercise) === "ladder") {
    const from = toNumber(exercise.ladderFrom, 1);
    const to = toNumber(exercise.ladderTo, from);

    return Math.abs(to - from) + 1;
  }

  return Math.max(1, toNumber(exercise.sets, 1));
}

export function getCurrentWorkoutStep(exercise, stepIndex) {
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

export function toNumber(value, fallback) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}
