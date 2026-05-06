import { TIMER_TICK, TIMER_COMPLETE, TIMER_SESSION_COMPLETE, TIMER_RESET, TIMER_MODE_CHANGE, TIMER_INCREMENT_POMODOROS, SETTINGS_DATA_CHANGED, fire, on, off } from '../src/js/events';

describe('events module', () => {
  test('event constants are correct strings', () => {
    expect(TIMER_TICK).toBe('timer:tick');
    expect(TIMER_COMPLETE).toBe('timer:complete');
    expect(TIMER_SESSION_COMPLETE).toBe('timer:sessionComplete');
    expect(TIMER_RESET).toBe('timer:reset');
    expect(TIMER_MODE_CHANGE).toBe('timer:modeChange');
    expect(TIMER_INCREMENT_POMODOROS).toBe('timer:incrementPomodoros');
    expect(SETTINGS_DATA_CHANGED).toBe('settings:dataChanged');
  });

  test('fire dispatches custom event', () => {
    const handler = jest.fn();
    document.addEventListener('timer:tick', handler);
    fire(TIMER_TICK, { remaining: 100 });
    expect(handler).toHaveBeenCalled();
    document.removeEventListener('timer:tick', handler);
  });

  test('on attaches event listener', () => {
    const handler = jest.fn();
    on(TIMER_COMPLETE, handler);
    fire(TIMER_COMPLETE, { mode: 'FOCUS' });
    expect(handler).toHaveBeenCalled();
    off(TIMER_COMPLETE, handler);
  });

  test('off removes event listener', () => {
    const handler = jest.fn();
    on(TIMER_RESET, handler);
    off(TIMER_RESET, handler);
    fire(TIMER_RESET, {});
    expect(handler).not.toHaveBeenCalled();
  });
});
