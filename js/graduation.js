// The graduation page, shown after Day 30 is completed.

import { element, link, persian } from './dom.js';
import { getTotalStars, hasGraduated, TOTAL_DAYS } from './state.js';

export function renderGraduation() {
  if (!hasGraduated()) {
    location.replace('#/');
    return null;
  }

  return [
    element('h1', 'Graduation 🎓'),
    element('p', `You finished all ${TOTAL_DAYS} days: 90 verbs and 60 abbreviations!`),
    persian('p', 'آفرین! هر ۳۰ روز را تمام کردی.'),
    element('p', `⭐ Total stars: ${getTotalStars()}`),
    element('p', 'The Practice Arena stays open, so you can keep practicing whenever you like.'),
    link('#/practice/mixed', 'Keep practicing 🎯'),
    element('br'),
    link('#/', 'Back to home'),
  ];
}
