import { t } from './i18n.js';

const STORAGE_KEY = 'pomodoro_theme' as const;
const THEME_DARK = 'dark' as const;
const THEME_LIGHT = 'light' as const;
const THEME_HIGH_CONTRAST = 'high-contrast' as const;

type Theme = 'dark' | 'light' | 'high-contrast';

function getSavedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === THEME_DARK || value === THEME_LIGHT || value === THEME_HIGH_CONTRAST) return value as Theme;
    return null;
  } catch (e) {
    console.warn('[Theme] Failed to read theme from LocalStorage:', e);
    return null;
  }
}

function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (e) {
    console.warn('[Theme] Failed to save theme to LocalStorage:', e);
  }
}

function getSystemPreference(): Theme {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return THEME_DARK;
  }
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return THEME_LIGHT;
  }
  return THEME_DARK;
}

function resolveTheme(): Theme {
  const saved = getSavedTheme();
  if (saved === THEME_DARK || saved === THEME_LIGHT || saved === THEME_HIGH_CONTRAST) {
    return saved;
  }
  return getSystemPreference();
}

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
}

const SVG_MOON = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
const SVG_SUN = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
const SVG_EYE = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/></svg>';

function updateToggleIcon(theme: Theme, btn: HTMLElement | null): void {
  if (!btn) return;
  if (theme === THEME_DARK) {
    btn.innerHTML = SVG_MOON;
  } else if (theme === THEME_LIGHT) {
    btn.innerHTML = SVG_SUN;
  } else {
    btn.innerHTML = SVG_EYE;
  }
  const label = theme === THEME_DARK
    ? (t('switchToLight') || 'Switch to light')
    : theme === THEME_LIGHT
      ? (t('switchToHighContrast') || 'Switch to high contrast')
      : (t('switchToDark') || 'Switch to dark');
  btn.setAttribute('aria-label', label);
  btn.setAttribute('title', label);
}

function nextTheme(current: Theme): Theme {
  if (current === THEME_DARK) return THEME_LIGHT;
  if (current === THEME_LIGHT) return THEME_HIGH_CONTRAST;
  return THEME_DARK;
}

export function initTheme(): void {
  let current: Theme = resolveTheme();
  applyTheme(current);

  const toggleBtn = document.getElementById('themeToggleBtn');
  if (!toggleBtn) {
    console.warn('[Theme] Toggle button #themeToggleBtn not found in DOM.');
    return;
  }

  updateToggleIcon(current, toggleBtn);

  toggleBtn.addEventListener('click', function () {
    current = nextTheme(current);
    applyTheme(current);
    saveTheme(current);
    updateToggleIcon(current, toggleBtn);
  });

  console.log('[Theme] Initialised — current theme:', current);
}
