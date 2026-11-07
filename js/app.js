// Entry point and hash router. Other pages are placeholders until their milestones.

import { initDebugPanel } from './debug.js';
import { renderGraduation } from './graduation.js';
import { createHero } from './hero.js';
import { renderLesson } from './lesson.js';
import { renderPractice } from './practice.js';
import { renderQuiz } from './quiz.js';
import { createSettings } from './settings.js';
import { stopSpeaking } from './speech.js';
import { createTabs } from './tabs.js';
import { applyTheme } from './theme.js';

const APP_NAME = 'Rezi Knows English';
const HOME = '#/';

const app = document.querySelector('#app');

// Days are limited to 1-30. Anything else counts as an unknown route.
const DAY = '([1-9]|[12][0-9]|30)';

const PRACTICE_TITLES = {
  mixed: 'Mixed practice',
  weak: 'Weak spots',
  match: 'Match pairs',
};

const routes = [
  { pattern: /^\/$/, title: () => APP_NAME, render: renderHome },
  { pattern: /^\/lesson$/, title: () => "Today's lesson", render: () => renderLesson() },
  { pattern: new RegExp(`^/lesson/${DAY}$`), title: (day) => `Review Day ${day}`, render: renderLesson },
  { pattern: new RegExp(`^/quiz/${DAY}$`), title: (day) => `Quiz for Day ${day}`, render: renderQuiz },
  {
    pattern: /^\/practice\/(mixed|weak|match)$/,
    title: (mode) => PRACTICE_TITLES[mode],
    render: (mode) => renderPractice(mode, PRACTICE_TITLES[mode]),
  },
  { pattern: /^\/graduation$/, title: () => 'Graduation', render: renderGraduation },
];

// Identifies the latest render, so a slower earlier one can't overwrite it.
let latestRender = 0;

function currentPath() {
  const path = location.hash.slice(1).replace(/(.)\/+$/, '$1');
  return path || '/';
}

function matchRoute(path) {
  for (const route of routes) {
    const match = path.match(route.pattern);
    if (match) return { route, params: match.slice(1) };
  }
  return null;
}

async function renderHome() {
  return [await createHero(), createTabs(), createSettings(render)];
}

function renderPlaceholder(title) {
  const heading = document.createElement('h1');
  heading.textContent = title;
  const back = document.createElement('a');
  back.href = HOME;
  back.textContent = 'Back to home';
  return [heading, back];
}

async function render() {
  const renderId = ++latestRender;
  const matched = matchRoute(currentPath());
  if (!matched) {
    location.replace(HOME);
    return;
  }

  const { route, params } = matched;
  const title = route.title(...params);
  const nodes = route.render ? await route.render(...params) : renderPlaceholder(title);
  if (renderId !== latestRender || !nodes) return;

  app.replaceChildren(...nodes);
  app.querySelector('[data-autofocus]')?.focus();
  document.title = title === APP_NAME ? APP_NAME : `${title} · ${APP_NAME}`;
}

window.addEventListener('hashchange', () => {
  stopSpeaking();
  render();
  // Moves keyboard and screen reader users to the new page.
  app.focus();
});

applyTheme();
render();
initDebugPanel(render);

// Offline support. If registration fails, the site still works online.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
