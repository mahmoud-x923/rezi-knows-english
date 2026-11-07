// The home page hero: a greeting picked at random on every page load.

import { loadGreetings, loadNames } from './data.js';
import { getNextDay, getStreak, TOTAL_DAYS } from './state.js';

const APP_NAME = 'Rezi Knows English';
const FALLBACK_GREETING = 'Ready to learn something new today? 🌟';
const NEAR_GRADUATION_DAYS = 5;

let greetingForThisLoad = null;

export function pickNickname(names, random = Math.random) {
  return names.nicknames[Math.floor(random() * names.nicknames.length)];
}

// The values greetings can use. Each call picks a nickname at random.
export function getNameValues(names, random = Math.random) {
  return { name: names.name, fullName: names.fullName, nickname: pickNickname(names, random) };
}

export function getTimeOfDay(hour) {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}

// Returns the text with placeholders filled, or null if a value is missing.
function fillPlaceholders(text, values) {
  let isComplete = true;
  const filled = text.replace(/\{\{(\w+)\}\}/g, (placeholder, name) => {
    if (values[name]) return values[name];
    isComplete = false;
    return placeholder;
  });
  return isComplete ? filled : null;
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
  const hero = document.createElement('header');

  const heading = document.createElement('h1');
  heading.textContent = APP_NAME;

  const greeting = document.createElement('p');
  greeting.textContent = await getGreeting();

  hero.append(heading, greeting);
  return hero;
}
