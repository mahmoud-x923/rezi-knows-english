// Entry point and hash router. Pages are placeholders until their milestones.

import { initDebugPanel } from './debug.js';

const APP_NAME = 'Rezi Knows English';
const HOME = '#/';

const app = document.querySelector('#app');

// Days are limited to 1-30. Anything else counts as an unknown route.
const DAY = '([1-9]|[12][0-9]|30)';

const routes = [
  { pattern: /^\/$/, title: () => 'Home' },
  { pattern: /^\/lesson$/, title: () => "Today's lesson" },
  { pattern: new RegExp(`^/lesson/${DAY}$`), title: (day) => `Review Day ${day}` },
  { pattern: new RegExp(`^/quiz/${DAY}$`), title: (day) => `Quiz for Day ${day}` },
  { pattern: /^\/practice\/(mixed|weak|match)$/, title: (mode) => `Practice: ${mode}` },
  { pattern: /^\/graduation$/, title: () => 'Graduation' },
];

const homeLinks = [
  ['#/lesson', "Today's lesson"],
  ['#/practice/mixed', 'Practice: mixed'],
  ['#/practice/weak', 'Practice: weak spots'],
  ['#/practice/match', 'Practice: match pairs'],
  ['#/graduation', 'Graduation'],
];

function link(href, label) {
  const element = document.createElement('a');
  element.href = href;
  element.textContent = label;
  return element;
}

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

function renderPlaceholder(title, isHome) {
  const heading = document.createElement('h1');
  heading.textContent = isHome ? APP_NAME : title;

  if (isHome) {
    const list = document.createElement('ul');
    list.append(...homeLinks.map(([href, label]) => {
      const item = document.createElement('li');
      item.append(link(href, label));
      return item;
    }));
    app.replaceChildren(heading, list);
  } else {
    app.replaceChildren(heading, link(HOME, 'Back to home'));
  }
}

function render() {
  const path = currentPath();
  const matched = matchRoute(path);
  if (!matched) {
    location.replace(HOME);
    return;
  }

  const title = matched.route.title(...matched.params);
  const isHome = path === '/';
  renderPlaceholder(title, isHome);
  document.title = isHome ? APP_NAME : `${title} · ${APP_NAME}`;
}

window.addEventListener('hashchange', () => {
  render();
  // Moves keyboard and screen reader users to the new page.
  app.focus();
});

render();
initDebugPanel(render);
