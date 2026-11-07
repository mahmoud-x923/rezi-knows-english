// The home page hero: a greeting picked at random on every page load.

import { loadGreetings, loadNames } from './data.js';
import { decor } from './decor.js';
import { element } from './dom.js';
import { createGuide } from './guide.js';
import { fillPlaceholders, getNameValues } from './names.js';
import { getNextDay, getStreak, TOTAL_DAYS } from './state.js';

const APP_NAME = 'Rezi Knows English';
const FALLBACK_GREETING = 'Ready to learn something new today? 🌟';
const NEAR_GRADUATION_DAYS = 5;

let greetingForThisLoad = null;

export function getTimeOfDay(hour) {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}

function conditionsMatch(greeting, context) {
  if (greeting.time && greeting.time !== context.time) return false;
  if (greeting.minStreak && context.streak < greeting.minStreak) return false;
  if (greeting.nearGraduation && !context.nearGraduation) return false;
  return true;
}

export function pickGreeting(greetings, context, random = Math.random) {
  const options = greetings
    .filter((greeting) => conditionsMatch(greeting, context))
    .map((greeting) => fillPlaceholders(greeting.text, context.values))
    .filter((text) => text !== null);
  if (options.length === 0) return FALLBACK_GREETING;
  return options[Math.floor(random() * options.length)];
}

function isNearGraduation(nextDay) {
  return nextDay !== null && TOTAL_DAYS - nextDay < NEAR_GRADUATION_DAYS;
}

async function getGreeting() {
  if (greetingForThisLoad) return greetingForThisLoad;
  try {
    // Without names, greetings that need them are skipped.
    const [greetings, names] = await Promise.all([loadGreetings(), loadNames().catch(() => null)]);
    greetingForThisLoad = pickGreeting(greetings, {
      time: getTimeOfDay(new Date().getHours()),
      streak: getStreak(),
      nearGraduation: isNearGraduation(getNextDay()),
      values: names ? getNameValues(names) : {},
    });
  } catch {
    greetingForThisLoad = FALLBACK_GREETING;
  }
  return greetingForThisLoad;
}

export async function createHero() {
  const hero = element('header');
  hero.className = 'hero';
  const heading = element('h1', APP_NAME);
  heading.append(decor('sparkle', 'hero-sparkle'), decor('heart', 'hero-heart'));
  const guide = createGuide('welcome', await getGreeting());
  guide.classList.add('guide-large');
  hero.append(heading, guide);
  return hero;
}
