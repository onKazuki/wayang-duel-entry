// Tiny gamelan-flavoured sounds, synthesised with WebAudio: no audio files,
// no network. Created lazily on the first user gesture, so it never blocks load.
let context = null;

function audio() {
  if (context) return context;
  try {
    const AudioContext = window.AudioContext ?? window.webkitAudioContext;
    context = new AudioContext();
  } catch {
    context = null;
  }
  return context;
}

function tone(freq, when, duration, type = 'sine', gain = 0.12) {
  const ctx = audio();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const envelope = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = freq;
  envelope.gain.setValueAtTime(0, ctx.currentTime + when);
  envelope.gain.linearRampToValueAtTime(gain, ctx.currentTime + when + 0.01);
  envelope.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + duration);
  oscillator.connect(envelope).connect(ctx.destination);
  oscillator.start(ctx.currentTime + when);
  oscillator.stop(ctx.currentTime + when + duration + 0.05);
}

export function unlockAudio() {
  const ctx = audio();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

export function playCardSound() {
  tone(660, 0, 0.18, 'triangle', 0.1);
  tone(880, 0.05, 0.22, 'triangle', 0.08);
}

export function damageSound() {
  tone(180, 0, 0.25, 'sawtooth', 0.09);
  tone(120, 0.05, 0.3, 'sine', 0.12);
}

export function shieldSound() {
  tone(520, 0, 0.3, 'sine', 0.1);
  tone(780, 0.08, 0.35, 'sine', 0.07);
}

export function endTurnSound() {
  tone(392, 0, 0.2, 'triangle', 0.09);
  tone(523, 0.12, 0.25, 'triangle', 0.09);
}

export function winSound() {
  [523, 659, 784, 1047, 1319].forEach((freq, i) => tone(freq, i * 0.12, 0.5, 'triangle', 0.1));
  tone(131, 0, 1.2, 'sine', 0.14); // low gong
}

export function loseSound() {
  [392, 330, 262, 196].forEach((freq, i) => tone(freq, i * 0.16, 0.5, 'sine', 0.1));
}
