// The lesson pages: today's lesson and reviewing a completed day.

import { loadLesson } from './data.js';
import { actions, arabic, buttonLink, element, link, persian } from './dom.js';
import { createGuide } from './guide.js';
import { isSpeechAvailable, speak, stopSpeaking } from './speech.js';
import {
  canStartLesson,
  getDayStatus,
  getNextDay,
  hasGraduated,
  isBonusAvailable,
} from './state.js';

const HOME = '#/';

const CONTEXT_NOTES = {
  texting: 'Used when texting. Not for formal email.',
  'social media': 'Used on social media. Not for formal email.',
  'work chats': 'Used in work chats and casual work messages.',
  'online gaming': 'Used in online games.',
};

function speakButton(label, text) {
  const button = element('button', '🔊');
  button.type = 'button';
  button.className = 'speak';
  button.setAttribute('aria-label', `Hear ${label}`);
  button.addEventListener('click', () => speak(text));
  return button;
}

// The 🔊 button is left out when the browser has no speech support.
function speechControls(label, text) {
  return isSpeechAvailable() ? [speakButton(label, text)] : [];
}

function createMeanings(item) {
  const meanings = element('div');
  meanings.className = 'meanings';
  meanings.append(persian('p', item.fa), arabic('p', item.ar));
  return meanings;
}

function createFormRow(label, forms, example) {
  const row = element('li');
  row.className = 'form-row';

  const details = element('div');
  details.className = 'form-details';
  const word = element('p', forms.join(' / '));
  word.className = 'form-word';
  details.append(element('p', label), word);

  const sentence = element('p', example);
  sentence.className = 'form-example';

  const spoken = forms.join(', ');
  row.append(details, ...speechControls(`${label}: ${spoken}`, spoken), sentence);
  return row;
}

function createVerbCard(verb) {
  const main = [verb.base, verb.past[0], verb.participle[0]];
  const card = element('article');
  card.className = 'card';

  const heading = element('h2', main.join(' → '));
  heading.className = 'verb-heading';

  const rows = element('ul');
  rows.className = 'form-rows';
  rows.append(
    createFormRow('Base form', [verb.base], verb.examples.base),
    createFormRow('Past simple', verb.past, verb.examples.past),
    createFormRow('Past participle', verb.participle, verb.examples.participle),
  );

  const pattern = element('p', `Pattern ${verb.pattern}: ${main.join(' / ')}`);
  pattern.className = 'pattern';

  card.append(heading, createMeanings(verb), rows, pattern);
  return card;
}

function createAbbreviationCard(item) {
  const card = element('article');
  card.className = 'card';

  const full = element('div');
  full.className = 'abbreviation-full';
  full.append(element('p', item.full), ...speechControls(item.full, item.full));

  const bubble = element('p', item.example);
  bubble.className = 'chat-bubble';

  const heading = element('h2', item.short);
  heading.className = 'abbreviation-short';
  const context = element('p', CONTEXT_NOTES[item.context]);
  context.className = 'context-note';

  card.append(heading, full, createMeanings(item), context);
  if (item.tone === 'rude') {
    const warning = element('p', '🌶️ Mildly rude. OK with close friends, never at work.');
    warning.className = 'rude-warning';
    card.append(warning);
  }
  card.append(bubble);
  return card;
}

function createEndScreen(day, isReview) {
  const screen = element('div');
  screen.className = 'card';
  if (isReview) {
    screen.append(
      element('h2', `That's all for Day ${day} 👏`),
      createGuide('proud', 'Nice review! Want to try the quiz again?'),
      actions(buttonLink(`#/quiz/${day}`, 'Retake the quiz', true), link(HOME, 'Back to home')),
    );
  } else {
    screen.append(
      element('h2', 'Ready for your quiz?'),
      createGuide('proud', 'You went through all 5 cards. I know you can do this!'),
      actions(buttonLink(`#/quiz/${day}`, 'Start the quiz', true)),
    );
  }
  return screen;
}

function navButton(label, onClick) {
  const button = element('button', label);
  button.type = 'button';
  button.addEventListener('click', onClick);
  return button;
}

function createLessonPage(title, day, label, isReview, lesson) {
  const cards = [
    ...lesson.verbs.map(createVerbCard),
    ...lesson.abbreviations.map(createAbbreviationCard),
  ];
  const position = element('p');
  position.className = 'lesson-position';
  const dots = element('div');
  dots.className = 'progress-dots';
  dots.setAttribute('aria-hidden', 'true');
  const content = element('div');
  content.tabIndex = -1;
  const nav = element('div');
  nav.className = 'lesson-nav';

  function show(index, moveFocus = true) {
    stopSpeaking();
    const isEnd = index === cards.length;
    position.textContent = isEnd ? label : `${label} · Card ${index + 1} of ${cards.length}`;
    dots.replaceChildren(...cards.map((card, dot) => {
      const node = element('span');
      if (dot < index) node.className = 'done';
      if (dot === index) node.className = 'current';
      return node;
    }));
    content.replaceChildren(isEnd ? createEndScreen(day, isReview) : cards[index]);
    const buttons = [];
    if (index > 0) buttons.push(navButton('Back', () => show(index - 1)));
    if (!isEnd) {
      const next = navButton('Next', () => show(index + 1));
      next.className = 'button-primary';
      buttons.push(next);
    }
    nav.replaceChildren(...buttons);
    if (moveFocus) content.focus();
  }

  show(0, false);
  const exit = link(HOME, 'Exit lesson');
  exit.className = 'exit-link';
  return [element('h1', title), position, dots, content, nav, exit];
}

function renderNoLesson() {
  if (hasGraduated()) {
    return [
      element('h1', "Today's lesson"),
      createGuide('cheer', "You've finished all 30 days 🎓"),
      actions(buttonLink('#/graduation', 'Graduation 🎓', true)),
    ];
  }
  return [
    element('h1', "Today's lesson"),
    createGuide('sleepy', "You've finished today's lessons. See you tomorrow 👋"),
    actions(buttonLink(HOME, 'Back to home')),
  ];
}

export function renderLoadError(title) {
  const retry = element('button', 'Try again');
  retry.type = 'button';
  retry.className = 'button-primary';
  retry.addEventListener('click', () => location.reload());
  return [
    element('h1', title),
    createGuide('thinking', "This page couldn't load. Check your connection and try again."),
    actions(retry, link(HOME, 'Back to home')),
  ];
}

// Shows a completed day when given one, otherwise the next lesson. A day that
// isn't completed can't be reviewed, so it redirects and returns null.
export async function renderLesson(reviewDay) {
  const isReview = reviewDay !== undefined;
  if (isReview && getDayStatus(Number(reviewDay)) !== 'completed') {
    location.replace('#/lesson');
    return null;
  }
  if (!isReview && !canStartLesson()) return renderNoLesson();

  const day = isReview ? Number(reviewDay) : getNextDay();
  const title = isReview ? `Review Day ${day}` : "Today's lesson";
  const label = !isReview && isBonusAvailable() ? `Day ${day} · Bonus lesson 🚀` : `Day ${day}`;

  try {
    return createLessonPage(title, day, label, isReview, await loadLesson(day));
  } catch {
    return renderLoadError(title);
  }
}
