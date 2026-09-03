import { describe, it, expect, beforeEach } from 'vitest';
import { detectLang, setLang, currentLang, pick, T } from '../src/i18n/lang';
describe('i18n', () => {
  beforeEach(() => localStorage.clear());
  it('defaults from navigator, persists explicit choice', () => {
    Object.defineProperty(navigator, 'language', { value: 'ko-KR', configurable: true }); expect(detectLang()).toBe('ko');
    setLang('en'); expect(currentLang()).toBe('en'); expect(detectLang()).toBe('en');
  });
  it('pick and UI strings', () => { expect(pick({ en: 'Hall', ko: '홀' }, 'ko')).toBe('홀'); expect(T.accuse.ko).toBe('기소'); expect(T.accuse.en).toBe('Accuse'); });
});
