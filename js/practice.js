// Practice Arena sessions: Mixed, Weak spots and Match pairs.

import { loadQuizContent } from './data.js';
import { actions, buttonLink, element, link } from './dom.js';
import { createMatchGame } from './games/match.js';
import { createGuide } from './guide.js';
import { renderLoadError } from './lesson.js';
import { createQuestion, createQuizRunner, shuffled, typesFor } from './quiz.js';
import { stopSpeaking } from './speech.js';
import { getCompletedDayCount, getProgress } from './state.js';

const HOME = '#/';
const SESSION_QUESTIONS = 10;

// Items answered wrong most often come first. Equal counts go by wrong-answer rate.
export function getWeakItems(items, stats) {
  const wrong = (item) => stats[item.id]?.wrong ?? 0;
  const rate = (item) => wrong(item) / (stats[item.id]?.seen || 1);
  return items
    .filter((item) => wrong(item) > 0)
    .sort((a, b) => wrong(b) - wrong(a) || rate(b) - rate(a));
}

// Goes through the items in turn, using a different question type each time around.
export function generatePracticeQuiz(items, pools, count, random = Math.random) {
  const order = shuffled(items, random);
  const unused = new Map(order.map((item) => [item, shuffled(typesFor(item), random)]));
  const questions = [];
  while (questions.length < count && order.some((item) => unused.get(item).length > 0)) {
    for (const item of order) {
      if (questions.length === count) break;
      const type = unused.get(item).pop();
      if (type) questions.push(createQuestion(item, type, pools, random));
    }
  }
  return shuffled(questions, random);
}

function createPracticeResult(correct, total, onAgain) {
  const result = element('div');
  result.className = 'result';
  result.tabIndex = -1;

  const again = element('button', 'Practice again');
  again.type = 'button';
  again.className = 'button-primary';
  again.addEventListener('click', onAgain);

  const buttons = element('div');
  buttons.className = 'result-actions';
  buttons.append(again, link(HOME, 'Back to home'));

  const message = correct === total ? 'Every single one! 🙌' : 'Practice makes it stick. Well done 💕';
  result.append(
    element('h2', `You got ${correct} of ${total} right`),
    createGuide(correct === total ? 'cheer' : 'sweet', message),
    buttons,
  );
  return result;
}

function renderNoWeakSpots() {
  return [
    createGuide('cheer', 'No weak spots yet. Keep it up 💪'),
    actions(buttonLink('#/practice/mixed', 'Try mixed practice', true), link(HOME, 'Back to home')),
  ];
}

function createQuizSession(getQuestions) {
  const page = element('div');

  function start() {
    const questions = getQuestions();
    const runner = createQuizRunner(questions, (correct) => {
      stopSpeaking();
      const result = createPracticeResult(correct, questions.length, () => {
        start();
        (page.querySelector('[data-autofocus]') ?? page.querySelector('[tabindex="-1"]')).focus();
      });
      page.replaceChildren(result);
      result.focus();
    });
    const exit = link(HOME, 'Exit practice');
    exit.className = 'exit-link';
    page.replaceChildren(...runner, exit);
  }

  start();
  return page;
}

// Everything comes from completed days. Before Day 1 is complete, it redirects home.
export async function renderPractice(mode, title) {
  const completedDays = getCompletedDayCount();
  if (completedDays === 0) {
    location.replace(HOME);
    return null;
  }

  let pools;
  try {
    ({ pools } = await loadQuizContent(completedDays));
  } catch {
    return renderLoadError(title);
  }
  const learned = [...pools.verbs.learned, ...pools.abbreviations.learned];
  const heading = element('h1', title);

  if (mode === 'match') return [heading, createMatchGame(learned)];

  if (mode === 'weak') {
    const getWeak = () => getWeakItems(learned, getProgress().itemStats).slice(0, SESSION_QUESTIONS);
    if (getWeak().length === 0) return [heading, ...renderNoWeakSpots()];
    return [heading, createQuizSession(() => {
      const weak = getWeak();
      return generatePracticeQuiz(weak, pools, Math.min(SESSION_QUESTIONS, weak.length * 2));
    })];
  }

  return [heading, createQuizSession(() => (
    generatePracticeQuiz(learned, pools, SESSION_QUESTIONS)
  ))];
}
