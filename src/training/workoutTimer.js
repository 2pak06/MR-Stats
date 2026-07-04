import { toNumber } from "./workoutEngine.js";

let restTimerId = null;

export function startRestTimer(exercise, trainingContext) {
  stopRestTimer();

  const activeWorkout = trainingContext.getActiveWorkout();

  if (!activeWorkout) {
    return;
  }

  trainingContext.setActiveWorkout({
    ...activeWorkout,
    rest: {
      exerciseName: exercise.name,
      secondsLeft: Math.max(0, toNumber(exercise.restTime, 0))
    }
  });

  trainingContext.refreshTrainingContent();
  trainingContext.saveActiveWorkoutState();

  if (trainingContext.getActiveWorkout().rest.secondsLeft <= 0) {
    restTimerId = window.setTimeout(trainingContext.finishRestAndAdvance, 0);
    return;
  }

  startRestCountdown(trainingContext);
}

export function startRestCountdown(trainingContext) {
  stopRestTimer();

  if (!trainingContext.getActiveWorkout()?.rest) {
    return;
  }

  restTimerId = window.setInterval(() => {
    const activeWorkout = trainingContext.getActiveWorkout();

    if (!activeWorkout?.rest) {
      stopRestTimer();
      return;
    }

    const secondsLeft = Math.max(0, activeWorkout.rest.secondsLeft - 1);

    trainingContext.setActiveWorkout({
      ...activeWorkout,
      rest: {
        ...activeWorkout.rest,
        secondsLeft
      }
    });

    trainingContext.refreshTrainingContent();
    trainingContext.saveActiveWorkoutState();

    if (secondsLeft <= 0) {
      trainingContext.finishRestAndAdvance();
    }
  }, 1000);
}

export function stopRestTimer() {
  if (!restTimerId) {
    return;
  }

  window.clearInterval(restTimerId);
  window.clearTimeout(restTimerId);
  restTimerId = null;
}
