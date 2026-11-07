// Curly, the guide: a sticker next to a speech bubble, with lines picked at random.

import { loadGuideLines, loadNames } from './data.js';
import { element } from './dom.js';
import { fillPlaceholders, getNameValues } from './names.js';

let lines = {};
let names = null;

// Loads Curly's lines and the names once, before the first page is shown.
// Without them, bubbles still show their main message.
export async function prepareGuide() {
  [lines, names] = await Promise.all([
    loadGuideLines().catch(() => ({})),
    loadNames().catch(() => null),
  ]);
}

// A random line for the moment, with names filled in, or null if none can be used.
export function say(moment, random = Math.random) {
  const values = names ? getNameValues(names, random) : {};
  const options = (lines[moment] ?? [])
    .map((line) => fillPlaceholders(line, values))
    .filter((line) => line !== null);
  return options.length > 0 ? options[Math.floor(random() * options.length)] : null;
}

// Each line is text, an element (such as a Persian line), or null to skip it.
export function createGuide(mood, ...bubbleLines) {
  const guide = element('div');
  guide.className = `guide guide-${mood}`;

  const sticker = element('img');
  sticker.className = 'guide-sticker';
  sticker.src = `stickers/${mood}.webp`;
  sticker.alt = '';
  sticker.width = 72;
  sticker.height = 72;

  const bubble = element('div');
  bubble.className = 'guide-bubble';
  const name = element('p', 'Curly');
  name.className = 'guide-name';
  bubble.append(name, ...bubbleLines.filter((line) => line !== null).map((line) => {
    if (typeof line !== 'string') return line;
    const text = element('p', line);
    text.className = 'guide-text';
    return text;
  }));

  guide.append(sticker, bubble);
  return guide;
}
