// Progress in localStorage, plus the unlocking and streak rules.

import { daysBetween, today } from './date.js';

const STORAGE_KEY = 'rezi-knows-english:v1';

export const TOTAL_DAYS = 30;
export const MAX_LESSONS_PER_DAY = 2;

// Holds progress that could not be saved, so the session keeps working.
let unsaved = null;

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalize(value) {
  const data = isObject(value) ? value : {};
  return {
    completedDays: isObject(data.completedDays) ? data.completedDays : {},
    lessonsByDate: isObject(data.lessonsByDate) ? data.lessonsByDate : {},
    streak: isObject(data.streak) ? data.streak : { count: 0, lastDate: null },
    itemStats: isObject(data.itemStats) ? data.itemStats : {},
  };
}

function read() {
  if (unsaved) return structuredClone(unsaved);
  try {
    return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return normalize(null);
  }
}

function write(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    unsaved = null;
  } catch {
    unsaved = progress;
  }
}

export function getProgress() {
  return read();
}

export function resetProgress() {
  unsaved = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage is unavailable, so there is nothing saved to remove.
  }
}

function highestCompletedDay(progress) {
  return Math.max(0, ...Object.keys(progress.completedDays).map(Number));
}

function nextDayFrom(progress) {
  const next = highestCompletedDay(progress) + 1;
  return next <= TOTAL_DAYS ? next : null;
}

function lessonsLeftFrom(progress, date) {
  const done = progress.lessonsByDate[date]?.length ?? 0;
  return Math.max(0, MAX_LESSONS_PER_DAY - done);
}

// The next uncompleted day, or null after Day 30.
export function getNextDay() {
  return nextDayFrom(read());
}

export function getLessonsLeftToday() {
  return lessonsLeftFrom(read(), today());
}

// Whether a new lesson can be started right now.
export function canStartLesson() {
  const progress = read();
  return nextDayFrom(progress) !== null && lessonsLeftFrom(progress, today()) > 0;
}

// The second new lesson of the day is the bonus lesson.
export function isBonusAvailable() {
  return canStartLesson() && getLessonsLeftToday() === MAX_LESSONS_PER_DAY - 1;
}

export function hasGraduated() {
  return getNextDay() === null;
}

// Returns "completed", "today" or "locked".
export function getDayStatus(day) {
  const progress = read();
  if (progress.completedDays[day]) return 'completed';
  const isNext = day === nextDayFrom(progress);
  return isNext && lessonsLeftFrom(progress, today()) > 0 ? 'today' : 'locked';
}

// The saved count only holds while the last lesson was today or yesterday.
export function getStreak() {
  const { count, lastDate } = read().streak;
  if (!lastDate) return 0;
  const gap = daysBetween(lastDate, today());
  return gap === 0 || gap === 1 ? count : 0;
}

export function getCompletedDayCount() {
  return Object.keys(read().completedDays).length;
}

export function getTotalStars() {
  return Object.values(read().completedDays).reduce((sum, { stars }) => sum + stars, 0);
}

// Finishes a new lesson, or keeps the best stars when retaking a completed day.
// Retakes don't affect the daily limit or the streak. Returns false if not allowed.
export function completeLesson(day, stars) {
  if (![1, 2, 3].includes(stars)) return false;

  const progress = read();
  const existing = progress.completedDays[day];
  if (existing) {
    existing.stars = Math.max(existing.stars, stars);
    write(progress);
    return true;
  }

  const date = today();
  if (day !== nextDayFrom(progress) || lessonsLeftFrom(progress, date) === 0) return false;

  progress.completedDays[day] = { stars, completedAt: date };
  progress.lessonsByDate[date] = [...(progress.lessonsByDate[date] ?? []), day];

  const { count, lastDate } = progress.streak;
  if (lastDate !== date) {
    const continues = lastDate && daysBetween(lastDate, date) === 1;
    progress.streak = { count: continues ? count + 1 : 1, lastDate: date };
  }

  write(progress);
  return true;
}
