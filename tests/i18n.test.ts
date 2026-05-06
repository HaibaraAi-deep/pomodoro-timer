import { t, tf, getCurrentLang, toggleLang } from '../src/js/i18n';

describe('i18n module', () => {
  beforeEach(() => {
    localStorage.clear();
    while (getCurrentLang() !== 'zh') {
      toggleLang();
    }
  });

  test('t() returns Chinese string by default', () => {
    expect(t('focus')).toBe('专注');
  });

  test('t() returns English string after switching', () => {
    toggleLang();
    expect(t('focus')).toBe('Focus');
  });

  test('t() returns key for unknown key', () => {
    expect(t('nonexistent_key')).toBe('nonexistent_key');
  });

  test('tf() replaces placeholders', () => {
    while (getCurrentLang() !== 'zh') toggleLang();
    expect(tf('sessionsMinutes', ['5', '125'])).toBe('5 次 · 125 分钟');
  });

  test('getCurrentLang returns a valid language', () => {
    const lang = getCurrentLang();
    expect(['zh', 'en']).toContain(lang);
  });

  test('toggleLang switches language', () => {
    const before = getCurrentLang();
    toggleLang();
    const after = getCurrentLang();
    expect(after).not.toBe(before);
  });
});
