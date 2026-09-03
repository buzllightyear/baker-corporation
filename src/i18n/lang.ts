import { create } from 'zustand';
import type { Text } from '../../content/types';
export type Lang = 'en' | 'ko';
const KEY = 'baker.lang';
export function detectLang(): Lang { try { const v = localStorage.getItem(KEY); if (v === 'en' || v === 'ko') return v; } catch {} return typeof navigator !== 'undefined' && /^ko/i.test(navigator.language ?? '') ? 'ko' : 'en'; }
export const useLang = create<{ lang: Lang; set: (l: Lang) => void }>((set) => ({ lang: detectLang(), set: (lang) => { try { localStorage.setItem(KEY, lang); } catch {} set({ lang }); } }));
export const setLang = (l: Lang) => useLang.getState().set(l);
export const currentLang = (): Lang => useLang.getState().lang;
export const pick = (t: Text, lang: Lang): string => t[lang];
export { T } from './ui';
