// Curly, the guide: a sticker next to a speech bubble.

import { element } from './dom.js';

// Placeholder faces until the stickers are added.
const STICKERS = {
  welcome: '✌️',
  proud: '👍',
  cheer: '🙌',
  thinking: '🤔',
  listening: '💬',
  cozy: '🧋',
  sleepy: '😴',
  sweet: '💕',
  pouting: '😤',
};

// Each line is either text or an element, such as a Persian line.
export function createGuide(mood, ...lines) {
  const guide = element('div');
  guide.className = `guide guide-${mood}`;

  const sticker = element('div', STICKERS[mood]);
  sticker.className = 'guide-sticker';
  sticker.setAttribute('aria-hidden', 'true');

  const bubble = element('div');
  bubble.className = 'guide-bubble';
  const name = element('p', 'Curly');
  name.className = 'guide-name';
  bubble.append(name, ...lines.map((line) => {
    if (typeof line !== 'string') return line;
    const text = element('p', line);
    text.className = 'guide-text';
    return text;
  }));

  guide.append(sticker, bubble);
  return guide;
}
