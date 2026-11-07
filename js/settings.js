// The ⚙️ Settings menu: theme, sounds, and reset, export and import progress.

import { today } from './date.js';
import { element } from './dom.js';
import { exportProgress, importProgress, parseProgress, resetProgress } from './state.js';
import { isSoundOn, setSoundOn } from './sound.js';
import { getThemeChoice, setThemeChoice } from './theme.js';

// Kept between renders, so the menu stays open and a message survives the update.
let isOpen = false;
let pendingMessage = '';

function button(label, onClick) {
  const node = element('button', label);
  node.type = 'button';
  node.addEventListener('click', onClick);
  return node;
}

function downloadProgress() {
  const file = new Blob([JSON.stringify(exportProgress(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const anchor = element('a');
  anchor.href = url;
  anchor.download = `rezi-knows-english-progress-${today()}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function readJsonFile(file) {
  try {
    return JSON.parse(await file.text());
  } catch {
    return null;
  }
}

// onChange runs after progress changes, so the page can show the update. It may
// return a promise, which is awaited before focus moves back to the menu.
export function createSettings(onChange) {
  const menu = element('details');
  menu.className = 'settings';
  menu.open = isOpen;
  menu.addEventListener('toggle', () => {
    isOpen = menu.open;
  });

  const message = element('p', pendingMessage);
  message.className = 'settings-message';
  message.setAttribute('aria-live', 'polite');
  pendingMessage = '';

  async function finish(text) {
    pendingMessage = text;
    await onChange();
    document.querySelector('.settings summary')?.focus();
  }

  const reset = button('Reset progress', () => {
    if (!confirm("Reset all progress? This can't be undone.")) return;
    resetProgress();
    finish('Progress reset.');
  });

  const download = button('Export progress', () => {
    downloadProgress();
    message.textContent = 'Progress file downloaded.';
  });

  const importLabel = element('label', 'Import progress');
  const fileInput = element('input');
  fileInput.type = 'file';
  fileInput.accept = 'application/json,.json';
  importLabel.append(fileInput);
  fileInput.addEventListener('change', async () => {
    const [file] = fileInput.files;
    if (!file) return;
    const data = await readJsonFile(file);
    fileInput.value = '';
    if (!parseProgress(data)) {
      message.textContent = "That file isn't a valid progress file, so nothing changed.";
      return;
    }
    if (!confirm('Replace your current progress with this file?')) return;
    importProgress(data);
    finish('Progress imported.');
  });

  const actions = element('div');
  actions.className = 'settings-actions';
  actions.append(download, importLabel, reset);

  const body = element('div');
  body.className = 'settings-body';
  const themeChoice = createChoice('Theme', 'theme', [['system', 'System'], ['light', '☀️ Light'], ['dark', '🌙 Dark']],
    getThemeChoice(), setThemeChoice);
  const soundChoice = createChoice('Sounds', 'sound', [['on', '🔊 On'], ['off', '🔇 Off']],
    isSoundOn() ? 'on' : 'off', (value) => setSoundOn(value === 'on'));
  body.append(themeChoice, soundChoice, actions, message);

  menu.append(element('summary', '⚙️ Settings'), body);
  return menu;
}

// A row of pill-shaped options, such as System / Light / Dark.
function createChoice(legend, name, choices, current, onChoose) {
  const group = element('fieldset');
  group.className = 'choice';
  const options = element('div');
  options.className = 'choice-options';

  for (const [value, label] of choices) {
    const option = element('label', label);
    const input = element('input');
    input.type = 'radio';
    input.name = name;
    input.value = value;
    input.checked = value === current;
    input.addEventListener('change', () => onChoose(value));
    option.append(input);
    options.append(option);
  }

  options.style.setProperty('--count', choices.length);
  group.append(element('legend', legend), options);
  return group;
}
