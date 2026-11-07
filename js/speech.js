// English pronunciation with the browser's text-to-speech.

import { msUntilQuiet } from './sound.js';

// A word waiting for a sound effect to finish, so the two never overlap.
let waiting = null;

export function isSpeechAvailable() {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

// Some Android browsers report languages as "en_US" instead of "en-US".
function findVoice(lang) {
  return speechSynthesis.getVoices().find((voice) => voice.lang.replace('_', '-') === lang);
}

function sayNow(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = findVoice('en-US') ?? findVoice('en-GB');
  utterance.lang = voice ? voice.lang.replace('_', '-') : 'en-US';
  if (voice) utterance.voice = voice;
  speechSynthesis.speak(utterance);
}

export function speak(text) {
  if (!isSpeechAvailable()) return;
  stopSpeaking();
  const wait = msUntilQuiet();
  if (wait > 0) waiting = setTimeout(() => sayNow(text), wait);
  else sayNow(text);
}

export function stopSpeaking() {
  clearTimeout(waiting);
  waiting = null;
  if (isSpeechAvailable()) speechSynthesis.cancel();
}
