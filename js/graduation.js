// The graduation page, shown after Day 30 is completed.

import { actions, buttonLink, element, link, persian } from './dom.js';
import { createGuide } from './guide.js';
import { getTotalStars, hasGraduated, TOTAL_DAYS } from './state.js';

export function renderGraduation() {
  if (!hasGraduated()) {
    location.replace('#/');
    return null;
  }

  const page = element('div');
  page.className = 'graduation';
  page.append(
    createGuide('cheer', `You finished all ${TOTAL_DAYS} days: 90 verbs and 60 abbreviations!`, "I'm so proud of you 💕"),
    persian('p', 'آفرین! هر ۳۰ روز را تمام کردی.'),
    element('p', `⭐ Total stars: ${getTotalStars()}`),
    element('p', 'The Practice Arena stays open, so you can keep practicing whenever you like.'),
    actions(buttonLink('#/practice/mixed', 'Keep practicing 🎯', true), link('#/', 'Back to home')),
  );
  return [element('h1', 'Graduation 🎓'), page];
}
