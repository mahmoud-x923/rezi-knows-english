// Light and dark mode: follows the phone unless a theme is chosen in Settings.

const THEME_KEY = 'rezi-knows-english:theme';
const THEME_COLORS = { light: '#fff5f9', dark: '#1c1424' };
const darkQuery = matchMedia('(prefers-color-scheme: dark)');

// Returns "system", "light" or "dark".
export function getThemeChoice() {
  try {
    const choice = localStorage.getItem(THEME_KEY);
    return choice === 'light' || choice === 'dark' ? choice : 'system';
  } catch {
    return 'system';
  }
}

function isDark(choice) {
  return choice === 'dark' || (choice === 'system' && darkQuery.matches);
}

export function applyTheme(choice = getThemeChoice()) {
  const root = document.documentElement;
  if (choice === 'system') delete root.dataset.theme;
  else root.dataset.theme = choice;
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLORS[isDark(choice) ? 'dark' : 'light']);
}

export function setThemeChoice(choice) {
  try {
    if (choice === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, choice);
  } catch {
    // Storage is unavailable, so the choice lasts until the page closes.
  }
  applyTheme(choice);
}

// Keeps the status bar color right when the phone switches between light and dark.
darkQuery.addEventListener('change', () => applyTheme());
