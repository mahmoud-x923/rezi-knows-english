// Calendar dates as local "YYYY-MM-DD" strings, plus the ?debug date override.

const OVERRIDE_KEY = 'rezi-knows-english:debug-date';
const MS_PER_DAY = 86400000;

export function isDebugMode() {
  return new URLSearchParams(location.search).has('debug');
}

// Uses the device's local date. toISOString() would give the UTC date instead.
export function formatLocalDate(date) {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toUtcMs(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

export function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return new Date(toUtcMs(value)).toISOString().slice(0, 10) === value;
}

export function addDays(dateString, days) {
  return new Date(toUtcMs(dateString) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

export function daysBetween(from, to) {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY);
}

export function getDateOverride() {
  try {
    const value = localStorage.getItem(OVERRIDE_KEY);
    return isValidDate(value) ? value : null;
  } catch {
    return null;
  }
}

export function setDateOverride(value) {
  try {
    if (isValidDate(value)) localStorage.setItem(OVERRIDE_KEY, value);
    else localStorage.removeItem(OVERRIDE_KEY);
  } catch {
    // Storage is unavailable, so the real date stays in use.
  }
}

// The override only applies while ?debug is in the URL.
export function today() {
  const override = isDebugMode() ? getDateOverride() : null;
  return override ?? formatLocalDate(new Date());
}
