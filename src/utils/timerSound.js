let audioContext = null;
let signalIntervalId = null;

export function startTimerFinishedSignal() {
  if (signalIntervalId) {
    return;
  }

  playSignalPattern();
  signalIntervalId = window.setInterval(playSignalPattern, 1400);
}

export function stopTimerFinishedSignal() {
  if (!signalIntervalId) {
    return;
  }

  window.clearInterval(signalIntervalId);
  signalIntervalId = null;
}

function playSignalPattern() {
  const context = getAudioContext();

  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    context.resume().catch(() => {});
  }

  playTone(context, 740, 0, 0.16);
  playTone(context, 920, 0.2, 0.16);
  playTone(context, 740, 0.62, 0.16);
  playTone(context, 920, 0.82, 0.18);
}

function getAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContext();
  }

  return audioContext;
}

function playTone(context, frequency, delay, duration) {
  const startTime = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.35, startTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.03);
}
