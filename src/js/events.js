export const TIMER_TICK = 'timer:tick';
export const TIMER_COMPLETE = 'timer:complete';
export const TIMER_SESSION_COMPLETE = 'timer:sessionComplete';
export const TIMER_RESET = 'timer:reset';
export const TIMER_MODE_CHANGE = 'timer:modeChange';
export const TIMER_INCREMENT_POMODOROS = 'timer:incrementPomodoros';
export const SETTINGS_DATA_CHANGED = 'settings:dataChanged';

export function fire(name, detail) {
  document.dispatchEvent(new CustomEvent(name, { detail }));
}

export function on(name, handler) {
  document.addEventListener(name, handler);
}

export function off(name, handler) {
  document.removeEventListener(name, handler);
}
