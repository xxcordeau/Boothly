import { createContext, useContext } from 'react';
import { Language, translations } from '../locales';
import type { TranslationKeys } from '../locales';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: 'ko',
  setLanguage: () => {},
  t: translations.ko,
});

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within LanguageProvider');
  }
  return context;
};