/**
 * theme.js — Theme Toggle Module
 *
 * Manages dark/light theme switching via the data-theme attribute on <html>.
 * Persists user preference to LocalStorage. Falls back to OS-level
 * prefers-color-scheme on first visit.
 *
 * LocalStorage key: pomodoro_theme
 *
 * Exports:
 *   initTheme() — attach toggle button listener, apply initial theme
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'pomodoro_theme';
const THEME_DARK  = 'dark';
const THEME_LIGHT = 'light';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Read the saved theme from LocalStorage.
 * Returns null if unset.
 *
 * @returns {string|null}
 */
function getSavedTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return null;
  }
}

/**
 * Persist the chosen theme to LocalStorage.
 *
 * @param {string} theme - 'dark' or 'light'
 */
function saveTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (e) {
    // Silently fail — theme will still apply for the session
  }
}

/**
 * Detect the OS-level colour scheme preference.
 *
 * @returns {string} 'dark' or 'light'
 */
function getSystemPreference() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return THEME_DARK;
  }
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return THEME_LIGHT;
  }
  // No explicit preference → default to dark
  return THEME_DARK;
}

/**
 * Determine the active theme:
 *   1. User-saved preference (LocalStorage)
 *   2. OS system preference
 *   3. Fallback: 'dark'
 *
 * @returns {string}
 */
function resolveTheme() {
  const saved = getSavedTheme();
  if (saved === THEME_DARK || saved === THEME_LIGHT) {
    return saved;
  }
  return getSystemPreference();
}

/**
 * Apply a theme by setting the data-theme attribute on <html>.
 *
 * @param {string} theme - 'dark' or 'light'
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

/**
 * Update the toggle button icon to reflect the current theme.
 *
 * @param {string} theme - 'dark' or 'light'
 * @param {HTMLElement} btn - the toggle button element
 */
function updateToggleIcon(theme, btn) {
  if (!btn) return;
  // Inline SVG icons — avoids cross-platform emoji rendering inconsistencies
  // Dark theme shows moon, light theme shows sun
  btn.innerHTML = theme === THEME_DARK
    ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  btn.setAttribute('aria-label', theme === THEME_DARK ? '切换到亮色主题' : '切换到暗色主题');
  btn.setAttribute('title', theme === THEME_DARK ? '切换到亮色主题' : '切换到暗色主题');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialize the theme system.
 * - Apply the resolved theme on load
 * - Wire the toggle button in the header
 *
 * Must be called after the DOM is ready.
 */
export function initTheme() {
  let current = resolveTheme();
  applyTheme(current);

  const toggleBtn = document.getElementById('themeToggleBtn');
  if (!toggleBtn) {
    console.warn('[Theme] Toggle button #themeToggleBtn not found in DOM.');
    return;
  }

  updateToggleIcon(current, toggleBtn);

  toggleBtn.addEventListener('click', function () {
    current = (current === THEME_DARK) ? THEME_LIGHT : THEME_DARK;
    applyTheme(current);
    saveTheme(current);
    updateToggleIcon(current, toggleBtn);
  });

  console.log('[Theme] Initialised — current theme:', current);
}
