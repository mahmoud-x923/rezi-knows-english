// The graduation page, shown after Day 30 is completed.

import { createFloaters, decorRow } from './decor.js';
import { actions, buttonLink, element, link, persian } from './dom.js';
import { createGuide, say } from './guide.js';
import { getTotalStars, hasGraduated, TOTAL_DAYS } from './state.js';

export function renderGraduation() {
  if (!hasGraduated()) {
    location.replace('#/');
    return null;
  }

  const guide = createGuide(
    'cheer',
    `You finished all ${TOTAL_DAYS} days: 90 verbs and 60 abbreviations!`,
    say('graduation') ?? "I'm so proud of you 💕",
  );
  guide.classList.add('guide-large');

  const page = element('div');
  page.className = 'graduation';
  page.append(
    createFloaters(),
    decorRow('heart', 'sparkle', 'star', 'sparkle', 'heart'),
    guide,
    persian('p', 'آفرین! هر ۳۰ روز را تمام کردی.'),
    element('p', `⭐ Total stars: ${getTotalStars()}`),
    element('p', 'The Practice Arena stays open, so you can keep practicing whenever you like.'),
    actions(buttonLink('#/practice/mixed', 'Keep practicing 🎯', true), link('#/', 'Back to home')),
  );
  return [element('h1', 'Graduation 🎓'), page];
}
