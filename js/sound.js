// Soft sound effects, made in the browser with the Web Audio API. No sound files.

const SOUND_KEY = 'rezi-knows-english:sound';
const VOLUME = 0.18;

// Buttons with their own sound, or that start speech, don't also make a tap sound.
const NO_TAP = '.speak, .question button, .options button, .typed-answer button, .match-board button, .lesson-nav button';

let context = null;
let output = null;
let noise = null;
let endsAt = 0;

export function isSoundOn() {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setSoundOn(isOn) {
  try {
    if (isOn) localStorage.removeItem(SOUND_KEY);
    else localStorage.setItem(SOUND_KEY, 'off');
  } catch {
    // Storage is unavailable, so the choice lasts until the page closes.
  }
}

// Browsers only allow sound after a tap, so the audio starts on the first one.
function unlock() {
  const AudioContext = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContext) return;
  if (!context) {
    context = new AudioContext();
    output = context.createGain();
    output.gain.value = VOLUME;
    output.connect(context.destination);
  }
  if (context.state === 'suspended') context.resume();
}

function isSpeaking() {
  return 'speechSynthesis' in window && (speechSynthesis.speaking || speechSynthesis.pending);
}

// How long until the current sound finishes, so speech can wait for it.
export function msUntilQuiet() {
  return Math.max(0, endsAt - performance.now());
}

function tone(frequency, start, duration, { type = 'sine', volume = 1, slideTo } = {}) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
  // A quick fade in and a longer fade out keep each note soft, without clicks.
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(output);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
  return start + duration;
}

function swish(start) {
  if (!noise) {
    noise = context.createBuffer(1, Math.floor(context.sampleRate * 0.25), context.sampleRate);
    const samples = noise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  }
  const source = context.createBufferSource();
  source.buffer = noise;
  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(700, start);
  filter.frequency.exponentialRampToValueAtTime(2600, start + 0.18);
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.35, start + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
  source.connect(filter).connect(gain).connect(output);
  source.start(start);
  source.stop(start + 0.22);
  return start + 0.2;
}

// Each sound schedules its notes from a start time and returns when it ends.
const SOUNDS = {
  tap: (t) => tone(620, t, 0.07, { volume: 0.45, slideTo: 480 }),
  swish: (t) => swish(t),
  correct: (t) => {
    tone(1046.5, t, 0.14, { type: 'triangle', volume: 0.6 });
    return tone(1318.5, t + 0.1, 0.22, { type: 'triangle', volume: 0.6 });
  },
  wrong: (t) => tone(233, t, 0.24, { volume: 0.55, slideTo: 175 }),
  star1: (t) => tone(880, t, 0.2, { type: 'triangle', volume: 0.5 }),
  star2: (t) => tone(1108.7, t, 0.2, { type: 'triangle', volume: 0.5 }),
  star3: (t) => tone(1318.5, t, 0.3, { type: 'triangle', volume: 0.5 }),
  pair: (t) => {
    tone(1568, t, 0.09, { type: 'triangle', volume: 0.4 });
    return tone(2093, t + 0.06, 0.14, { type: 'triangle', volume: 0.4 });
  },
  matchDone: (t) => [1046.5, 1318.5, 1568, 2093]
    .reduce((end, note, i) => tone(note, t + i * 0.09, 0.22, { type: 'triangle', volume: 0.45 }), t),
  streak: (t) => {
    tone(784, t, 0.38, { volume: 0.45 });
    return tone(1175, t + 0.08, 0.38, { volume: 0.35 });
  },
  graduation: (t) => [784, 1046.5, 1318.5, 1568, 1318.5, 1568, 2093]
    .reduce((end, note, i) => tone(note, t + i * 0.14, i === 6 ? 0.5 : 0.18, { type: 'triangle', volume: 0.45 }), t),
};

// Plays a sound after an optional delay in seconds. Skipped when sounds are off,
// before the first tap, or while a word is being pronounced.
export function play(name, delay = 0) {
  if (!context || context.state === 'closed' || !isSoundOn() || isSpeaking()) return;
  const start = context.currentTime + delay;
  const end = SOUNDS[name](start);
  endsAt = Math.max(endsAt, performance.now() + (end - context.currentTime) * 1000);
}

document.addEventListener('pointerdown', unlock, { capture: true });
document.addEventListener('keydown', unlock, { capture: true });

// A tiny pop for taps. It runs before the tapped button's own action.
document.addEventListener('click', (event) => {
  // A Settings option's hidden radio covers it, so the radio's click makes the pop.
  const target = event.target.closest('button, .button, a, summary, .choice-options input');
  if (!target || target.disabled || target.matches(NO_TAP)) return;
  play('tap');
}, { capture: true });
