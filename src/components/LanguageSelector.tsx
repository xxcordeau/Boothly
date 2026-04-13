import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { useTranslation } from '../hooks/useTranslation';
import { Language, languageNames } from '../locales';
import { useIsMobile } from './ui/use-mobile';

export const LanguageSelector = () => {
  const { language, setLanguage } = useTranslation();
  const isMobile = useIsMobile();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={isMobile ? 'sm' : 'default'}
          className="gap-1 md:gap-2 bg-white hover:bg-slate-50 border-slate-200"
        >
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">{languageNames[language]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {(Object.keys(languageNames) as Language[]).map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`cursor-pointer ${language === lang ? 'bg-blue-50 text-blue-600' : ''}`}
          >
            {languageNames[lang]}
            {language === lang && (
              <span className="ml-auto">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
