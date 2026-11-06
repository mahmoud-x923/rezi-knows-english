// English pronunciation with the browser's text-to-speech.

export function isSpeechAvailable() {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

// Some Android browsers report languages as "en_US" instead of "en-US".
function findVoice(lang) {
  return speechSynthesis.getVoices().find((voice) => voice.lang.replace('_', '-') === lang);
}

export function speak(text) {
  if (!isSpeechAvailable()) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = findVoice('en-US') ?? findVoice('en-GB');
  utterance.lang = voice ? voice.lang.replace('_', '-') : 'en-US';
  if (voice) utterance.voice = voice;
  speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (isSpeechAvailable()) speechSynthesis.cancel();
}
