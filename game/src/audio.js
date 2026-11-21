// audio.js — tiny synthesised sound effects for Difference Hunter.
// No audio files: every sound is an oscillator blip, so the game ships
// zero external assets and plays offline.

let audioCtx = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function ctx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tone(freq, startAt, dur, type, vol) {
  if (muted) return;
  const ac = ctx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ac.currentTime + startAt;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// A satisfying two-note chime when a difference is found.
export function playFound() {
  tone(740, 0, 0.16, 'sine', 0.22);
  tone(1108, 0.09, 0.24, 'sine', 0.2);
}

// A low buzz for a wrong click.
export function playMiss() {
  tone(160, 0, 0.18, 'sawtooth', 0.1);
}

// A short arpeggio when a level is cleared.
export function playClear() {
  tone(523, 0, 0.14, 'triangle', 0.2);
  tone(659, 0.11, 0.14, 'triangle', 0.2);
  tone(784, 0.22, 0.22, 'triangle', 0.22);
  tone(1046, 0.33, 0.3, 'triangle', 0.2);
}

// A soft tick for the hint.
export function playHint() {
  tone(980, 0, 0.1, 'sine', 0.12);
}
