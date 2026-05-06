export interface EventDetail extends Record<string, unknown> {}

export const TIMER_TICK: string = 'timer:tick';
export const TIMER_COMPLETE: string = 'timer:complete';
export const TIMER_SESSION_COMPLETE: string = 'timer:sessionComplete';
export const TIMER_RESET: string = 'timer:reset';
export const TIMER_MODE_CHANGE: string = 'timer:modeChange';
export const TIMER_INCREMENT_POMODOROS: string = 'timer:incrementPomodoros';
export const SETTINGS_DATA_CHANGED: string = 'settings:dataChanged';

export function fire(name: string, detail?: EventDetail): void {
  document.dispatchEvent(new CustomEvent(name, { detail }));
}

export function on(name: string, handler: EventListener): void {
  document.addEventListener(name, handler);
}

export function off(name: string, handler: EventListener): void {
  document.removeEventListener(name, handler);
}
