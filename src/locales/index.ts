import { ko } from './ko';
import type { TranslationKeys } from './ko';
import { en } from './en';
import { zh } from './zh';
import { fr } from './fr';
import { de } from './de';

export type Language = 'ko' | 'en' | 'zh' | 'fr' | 'de';

export const translations: Record<Language, TranslationKeys> = {
  ko,
  en,
  zh,
  fr,
  de,
};

export const languageNames: Record<Language, string> = {
  ko: '한국어',
  en: 'English',
  zh: '中文',
  fr: 'Français',
  de: 'Deutsch',
};

export type { TranslationKeys };