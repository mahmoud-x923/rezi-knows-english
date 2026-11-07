// The home page tabs: How It Works, My Journey and Practice Arena.

import { buttonLink, element, link, persian } from './dom.js';
import { decorRow } from './decor.js';
import { createGuide, say } from './guide.js';
import {
  canStartLesson,
  getCompletedDayCount,
  getDayStatus,
  getProgress,
  getStreak,
  getTotalStars,
  hasGraduated,
  isBonusAvailable,
  TOTAL_DAYS,
} from './state.js';

const ITEMS_PER_DAY = 5;

const STEPS = [
  { text: 'Learn 5 new things every day: 3 verbs and 2 abbreviations.', fa: 'هر روز ۵ چیز جدید یاد بگیر: ۳ فعل و ۲ مخفف.' },
  { text: 'Play the quiz at the end of each lesson.', fa: 'در پایان هر درس، آزمون را انجام بده.' },
  { text: 'Earn up to 3 stars for each quiz.', fa: 'در هر آزمون تا ۳ ستاره بگیر.' },
  { text: 'Come back every day to keep your streak.', fa: 'هر روز برگرد تا زنجیره‌ات قطع نشود.' },
];

const PRACTICE_MODES = [
  { href: '#/practice/mixed', label: '🎲 Mixed' },
  { href: '#/practice/weak', label: '💪 Weak spots' },
  { href: '#/practice/match', label: '🧩 Match pairs' },
];

const TABS = [
  { id: 'how', label: '🌱 How It Works', render: renderHowItWorks },
  { id: 'journey', label: '🗺️ My Journey', render: renderJourney },
  { id: 'practice', label: '🎯 Practice Arena', render: renderPractice },
];

let selectedId = TABS[0].id;

function renderHowItWorks() {
  const steps = element('ol');
  steps.className = 'steps';
  steps.append(...STEPS.map(({ text, fa }) => {
    const item = element('li');
    item.append(element('p', text), persian('p', fa));
    return item;
  }));

  const note = element('div');
  note.className = 'note';
  note.append(
    element('p', 'One new lesson unlocks each day. After you finish it, you can take one bonus lesson the same day.'),
    persian('p', 'هر روز یک درس جدید باز می‌شود. بعد از تمام کردن آن، می‌توانی همان روز یک درس جایزه هم بخوانی.'),
  );

  const guide = createGuide('listening', say('howItWorks') ?? "Hi, I'm Curly! Here's how we'll learn together:");
  guide.classList.add('guide-large');
  return [guide, steps, note];
}

function renderSummary() {
  const rows = [
    ['🔥 Streak', getStreak()],
    ['📚 Words learned', getCompletedDayCount() * ITEMS_PER_DAY],
    ['⭐ Total stars', getTotalStars()],
  ];
  const summary = element('dl');
  summary.className = 'summary';
  summary.append(...rows.map(([term, value]) => {
    const stat = element('div');
    stat.className = 'stat';
    stat.append(element('dt', term), element('dd', value));
    return stat;
  }));
  return summary;
}

function renderNextStep() {
  if (hasGraduated()) return buttonLink('#/graduation', 'Graduation 🎓', true);
  if (isBonusAvailable()) return buttonLink('#/lesson', 'Bonus lesson 🚀', true);
  if (canStartLesson()) return buttonLink('#/lesson', "Start today's lesson", true);
  return createGuide('sleepy', "You've finished today's lessons. See you tomorrow 👋", say('dailyLimit'));
}

function renderStop(day, completedDays) {
  const status = getDayStatus(day);
  if (status === 'completed') {
    return link(`#/lesson/${day}`, `✅ Day ${day} ${'⭐'.repeat(completedDays[day].stars)}`);
  }
  if (status === 'today') return link('#/lesson', `⭐ Day ${day}: today`);
  return element('span', `🔒 Day ${day}`);
}

function renderJourney() {
  const { completedDays } = getProgress();
  const path = element('ol');
  path.className = 'journey';
  for (let day = 1; day <= TOTAL_DAYS; day++) {
    const stop = element('li');
    stop.className = `stop-${getDayStatus(day)}`;
    stop.dataset.day = day;
    stop.append(renderStop(day, completedDays));
    path.append(stop);
  }
  const nextStep = element('div');
  nextStep.className = 'next-step';
  nextStep.append(renderNextStep());
  return [renderSummary(), nextStep, decorRow('cloud', 'sparkle', 'cloud'), path, decorRow('star', 'heart', 'star')];
}

function renderPractice() {
  const isUnlocked = getCompletedDayCount() > 0;
  const modes = element('ul');
  modes.className = 'practice-modes';
  modes.append(...PRACTICE_MODES.map(({ href, label }) => {
    const item = element('li');
    if (isUnlocked) {
      item.append(link(href, label));
    } else {
      const button = element('button', label);
      button.type = 'button';
      button.disabled = true;
      item.append(button);
    }
    return item;
  }));

  return isUnlocked
    ? [createGuide('cozy', 'Practice everything you have learned so far.', say('practiceOpen')), modes]
    : [createGuide('sleepy', 'Finish Day 1 and your practice games will open here 🎯', say('practiceLocked')), modes];
}

export function createTabs() {
  const container = element('section');

  const list = element('div');
  list.className = 'tab-list';
  list.setAttribute('role', 'tablist');
  list.setAttribute('aria-label', 'Home sections');

  const panel = element('div');
  panel.id = 'tab-panel';
  panel.className = 'tab-panel';
  panel.tabIndex = 0;
  panel.setAttribute('role', 'tabpanel');

  const buttons = TABS.map(({ id, label }) => {
    const button = element('button', label);
    button.type = 'button';
    button.id = `tab-${id}`;
    button.className = 'tab';
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', panel.id);
    button.addEventListener('click', () => select(id));
    return button;
  });

  function select(id) {
    selectedId = id;
    TABS.forEach((tab, index) => {
      const isSelected = tab.id === id;
      buttons[index].setAttribute('aria-selected', String(isSelected));
      buttons[index].tabIndex = isSelected ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', `tab-${id}`);
    panel.replaceChildren(...TABS.find((tab) => tab.id === id).render());
  }

  list.addEventListener('keydown', (event) => {
    const current = TABS.findIndex((tab) => tab.id === selectedId);
    const targets = {
      ArrowRight: (current + 1) % TABS.length,
      ArrowLeft: (current - 1 + TABS.length) % TABS.length,
      Home: 0,
      End: TABS.length - 1,
    };
    if (!(event.key in targets)) return;
    event.preventDefault();
    const target = targets[event.key];
    select(TABS[target].id);
    buttons[target].focus();
  });

  list.append(...buttons);
  container.append(list, panel);
  select(selectedId);
  return container;
}
