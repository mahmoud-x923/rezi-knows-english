// The ?debug panel: override today's date and test unlocking without waiting.

import { addDays, getDateOverride, isDebugMode, setDateOverride, today } from './date.js';
import {
  canStartLesson,
  getLessonsLeftToday,
  getNextDay,
  getStreak,
  getTotalStars,
  isBonusAvailable,
  resetProgress,
} from './state.js';

function button(label, onClick) {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = label;
  element.addEventListener('click', onClick);
  return element;
}

function statusRows() {
  return [
    ['Date', `${today()}${getDateOverride() ? ' (override)' : ''}`],
    ['Next lesson', getNextDay() ?? 'None, all days complete'],
    ['Can start', canStartLesson() ? (isBonusAvailable() ? 'Yes, bonus' : 'Yes') : 'No'],
    ['Lessons left today', getLessonsLeftToday()],
    ['Streak', getStreak()],
    ['Total stars', getTotalStars()],
  ];
}

// Adds the panel when ?debug is in the URL. onChange runs after any change.
export function initDebugPanel(onChange) {
  if (!isDebugMode()) return;

  const panel = document.createElement('aside');
  panel.className = 'debug-panel';
  panel.setAttribute('aria-label', 'Debug panel');

  const heading = document.createElement('h2');
  heading.textContent = 'Debug';

  const status = document.createElement('dl');
  status.setAttribute('aria-live', 'polite');

  const dateLabel = document.createElement('label');
  dateLabel.textContent = "Today's date";
  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateLabel.append(dateInput);

  function refresh() {
    const rows = statusRows().flatMap(([term, value]) => {
      const dt = document.createElement('dt');
      dt.textContent = term;
      const dd = document.createElement('dd');
      dd.textContent = value;
      return [dt, dd];
    });
    status.replaceChildren(...rows);
    dateInput.value = today();
    onChange();
  }

  dateInput.addEventListener('change', () => {
    setDateOverride(dateInput.value);
    refresh();
  });

  const actions = document.createElement('div');
  actions.className = 'debug-actions';
  actions.append(
    button('Next day', () => {
      setDateOverride(addDays(today(), 1));
      refresh();
    }),
    button('Use real date', () => {
      setDateOverride(null);
      refresh();
    }),
    button('Reset progress', () => {
      if (!confirm('Reset all progress?')) return;
      resetProgress();
      refresh();
    }),
  );

  panel.append(heading, status, dateLabel, actions);
  document.body.append(panel);
  refresh();
}
