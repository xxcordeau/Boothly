import { useState, useMemo } from "react";
import { Check, Image } from "lucide-react";
import type { PrintOption, TemplateType, ModeType } from "../types/photobooth";
import { useTranslation } from "../hooks/useTranslation";
import { getTemplateSetting } from "../utils/templateSettings";
import { useIsMobile } from "./ui/use-mobile";
import { PageHeader } from "./PageHeader";

interface PrintCountSelectorProps {
  onSelect: (printOption: PrintOption) => void;
  onBack: () => void;
  templateId?: TemplateType;
  mode?: ModeType;
}

const PRINT_COUNTS = [2, 4, 6, 8];

export const PrintCountSelector = ({ onSelect, onBack, templateId, mode = "basic" }: PrintCountSelectorProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const basePrice = useMemo(() => {
    if (!templateId) return 5000;
    const setting = getTemplateSetting(templateId, mode);
    return setting.basePrice;
  }, [templateId, mode]);

  const PRINT_OPTIONS: PrintOption[] = PRINT_COUNTS.map((count) => ({ count, price: basePrice * count }));
  const [selectedOption, setSelectedOption] = useState<PrintOption>(PRINT_OPTIONS[0]);

  if (isMobile) {
    return (
      <div className="h-[calc(100dvh-56px)] flex flex-col bg-[#F3F3F3] overflow-hidden page-enter">
        <div className="w-full h-full flex flex-col p-4">
          <PageHeader title={t.printCount.title} subtitle={t.printCount.subtitle} />

          <div className="flex-1 grid grid-cols-2 gap-3 content-center min-h-0">
            {PRINT_OPTIONS.map((option) => {
              const isSelected = selectedOption.count === option.count;
              return (
                <button key={option.count} onClick={() => setSelectedOption(option)}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
                    isSelected ? "bg-stone-900 shadow-md -translate-y-0.5" : "bg-white shadow-sm active:shadow-md"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-stone-900 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className={`p-2 rounded-lg ${isSelected ? "bg-white/30" : "bg-stone-100"}`}>
                    <Image className={`w-4 h-4 ${isSelected ? "text-white" : "text-stone-400"}`} />
                  </div>
                  <p className={`text-3xl font-bold ${isSelected ? "text-white" : "text-stone-800"}`}>{option.count}</p>
                  <p className={`text-xs font-bold ${isSelected ? "text-white/80" : "text-stone-400"}`}>장</p>
                  <p className={`text-xs font-semibold ${isSelected ? "text-white" : "text-stone-500"}`}>
                    {option.price.toLocaleString()}{t.printCount.price}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="bg-white p-3 rounded-2xl mb-3 flex-shrink-0 shadow-sm">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-stone-100 rounded-lg">
                  <Image className="w-4 h-4 text-stone-500" />
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-medium">{t.printCount.title}</p>
                  <p className="text-sm text-stone-900 font-bold">{selectedOption.count}{t.printCount.sheets}</p>
                </div>
              </div>
              <div className="w-px h-8 bg-stone-100" />
              <div>
                <p className="text-xs text-stone-400 font-medium">{t.payment.totalAmount}</p>
                <p className="text-sm text-stone-900 font-bold">{selectedOption.price.toLocaleString()}{t.printCount.price}</p>
              </div>
            </div>
          </div>

          <button onClick={() => onSelect(selectedOption)}
            className="flex-shrink-0 w-full py-3 bg-stone-900 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-stone-800 transition-colors"
          >
            {t.common.next}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#F3F3F3] overflow-hidden page-enter">
      <div className="w-full h-full flex flex-col justify-center mx-auto py-4">
        <PageHeader title={t.printCount.title} subtitle={t.printCount.subtitle} />

        <div className="flex-shrink-0 px-6 mb-4">
          <div className="w-full max-w-3xl mx-auto">
            <div className="grid grid-cols-4 gap-4 mb-4">
              {PRINT_OPTIONS.map((option) => {
                const isSelected = selectedOption.count === option.count;
                return (
                  <button key={option.count} onClick={() => setSelectedOption(option)}
                    className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl transition-all ${
                      isSelected
                        ? "bg-stone-900 shadow-lg -translate-y-1"
                        : "bg-white shadow-md hover:-translate-y-0.5 hover:shadow-lg"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-7 h-7 bg-stone-900 rounded-full flex items-center justify-center shadow-sm">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`p-3 rounded-xl ${isSelected ? "bg-white/30" : "bg-stone-100"}`}>
                      <Image className={`w-7 h-7 ${isSelected ? "text-white" : "text-stone-400"}`} />
                    </div>
                    <div className="text-center">
                      <p className={`text-4xl font-bold mb-0.5 ${isSelected ? "text-white" : "text-stone-800"}`}>{option.count}</p>
                      <p className={`text-sm font-bold ${isSelected ? "text-white/80" : "text-stone-400"}`}>장</p>
                    </div>
                    <p className={`text-sm font-semibold ${isSelected ? "text-white" : "text-stone-500"}`}>
                      {option.price.toLocaleString()}{t.printCount.price}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm">
              <div className="flex items-center justify-center gap-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-stone-100 rounded-xl">
                    <Image className="w-5 h-5 text-stone-500" />
                  </div>
                  <div>
                    <p className="text-sm text-stone-400 font-medium">{t.printCount.title}</p>
                    <p className="text-base text-stone-900 font-bold">{selectedOption.count}{t.printCount.sheets}</p>
                  </div>
                </div>
                <div className="w-px h-12 bg-stone-100" />
                <div>
                  <p className="text-sm text-stone-400 font-medium">{t.payment.totalAmount}</p>
                  <p className="text-base text-stone-900 font-bold">{selectedOption.price.toLocaleString()}{t.printCount.price}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center px-6 flex-shrink-0">
          <button onClick={() => onSelect(selectedOption)}
            className="px-16 py-4 bg-stone-900 text-white rounded-xl text-lg font-bold shadow-sm hover:bg-stone-800 hover:-translate-y-0.5 transition-all"
          >
            {t.common.next}
          </button>
        </div>
      </div>
    </div>
  );
};
