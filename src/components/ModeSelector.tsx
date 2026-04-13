import { Sparkles, Palette, Check } from 'lucide-react';
import { ModeType } from '../types/photobooth';
import { useTranslation } from '../hooks/useTranslation';
import { useIsMobile } from './ui/use-mobile';
import { PageHeader } from './PageHeader';

interface ModeSelectorProps {
  onSelect: (mode: ModeType) => void;
}

export const ModeSelector = ({ onSelect }: ModeSelectorProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const basicFeatures = [t.modeSelector.basic.feature1, t.modeSelector.basic.feature2, t.modeSelector.basic.feature3].filter(Boolean);
  const specialFeatures = [t.modeSelector.special.feature1, t.modeSelector.special.feature2, t.modeSelector.special.feature3].filter(Boolean);

  if (isMobile) {
    return (
      <div className="h-[calc(100dvh-56px)] flex flex-col bg-[#F3F3F3] overflow-hidden page-enter">
        <div className="w-full h-full flex flex-col p-4">
          <PageHeader title={t.modeSelector.title} subtitle={t.modeSelector.subtitle} />

          <div className="flex-1 flex flex-col gap-3 justify-center min-h-0">
            <button onClick={() => onSelect('basic')} className="flex-1 text-left active:scale-[0.98] transition-transform">
              <div className="h-full p-4 bg-white rounded-2xl flex flex-col shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Palette className="w-6 h-6 text-stone-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-stone-900 text-base font-bold">{t.modeSelector.basic.title}</h2>
                    <p className="text-stone-400 text-xs">{t.modeSelector.basic.description}</p>
                  </div>
                </div>
                {basicFeatures.length > 0 && (
                  <ul className="mb-3 space-y-1">
                    {basicFeatures.map((f) => (
                      <li key={f} className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-stone-400 flex-shrink-0" />
                        <span className="text-stone-500 text-xs">{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-auto w-full bg-stone-900 text-white py-2.5 px-4 rounded-xl text-center text-sm font-bold">
                  {t.modeSelector.basic.button}
                </div>
              </div>
            </button>

            <button onClick={() => onSelect('special')} className="flex-1 text-left active:scale-[0.98] transition-transform">
              <div className="h-full p-4 bg-white rounded-2xl flex flex-col shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-stone-900 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-stone-900 text-base font-bold">{t.modeSelector.special.title}</h2>
                    <p className="text-stone-400 text-xs">{t.modeSelector.special.description}</p>
                  </div>
                </div>
                {specialFeatures.length > 0 && (
                  <ul className="mb-3 space-y-1">
                    {specialFeatures.map((f) => (
                      <li key={f} className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-stone-500 flex-shrink-0" />
                        <span className="text-stone-500 text-xs">{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-auto w-full bg-stone-900 text-white py-2.5 px-4 rounded-xl text-center text-sm font-bold">
                  {t.modeSelector.special.button}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#F3F3F3] overflow-hidden page-enter">
      <div className="w-full h-full flex flex-col justify-center mx-auto py-4">
        <PageHeader title={t.modeSelector.title} subtitle={t.modeSelector.subtitle} />

        <div className="flex-shrink-0 px-6 py-3">
          <div className="grid grid-cols-2 gap-5 w-full max-w-3xl mx-auto">
            <button onClick={() => onSelect('basic')} className="text-left group transition-transform hover:-translate-y-1">
              <div className="p-8 bg-white rounded-2xl h-full shadow-sm group-hover:shadow-lg transition-shadow">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-stone-100 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                    <Palette className="w-10 h-10 text-stone-700" />
                  </div>
                  <h2 className="text-stone-900 mb-2 text-2xl font-bold">{t.modeSelector.basic.title}</h2>
                  <p className="text-stone-400 mb-4 text-base">{t.modeSelector.basic.description}</p>
                  {basicFeatures.length > 0 && (
                    <ul className="text-left w-full mb-6 space-y-1.5">
                      {basicFeatures.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                          <span className="text-stone-500 text-sm">{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="w-full bg-stone-900 text-white py-3 px-6 rounded-xl text-base font-bold">
                    {t.modeSelector.basic.button}
                  </div>
                </div>
              </div>
            </button>

            <button onClick={() => onSelect('special')} className="text-left group transition-transform hover:-translate-y-1">
              <div className="p-8 bg-white rounded-2xl h-full shadow-sm group-hover:shadow-lg transition-shadow">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-stone-900 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-stone-900 mb-2 text-2xl font-bold">{t.modeSelector.special.title}</h2>
                  <p className="text-stone-400 mb-4 text-base">{t.modeSelector.special.description}</p>
                  {specialFeatures.length > 0 && (
                    <ul className="text-left w-full mb-6 space-y-1.5">
                      {specialFeatures.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" />
                          <span className="text-stone-500 text-sm">{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="w-full bg-stone-900 text-white py-3 px-6 rounded-xl text-base font-bold">
                    {t.modeSelector.special.button}
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
