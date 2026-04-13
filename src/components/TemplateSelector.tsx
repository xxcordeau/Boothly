import { TemplateConfig, ModeType } from "../types/photobooth";
import { TEMPLATES } from "../config/templates";
import { Grid3x3 } from "lucide-react";
import { getTemplateSetting } from "../utils/templateSettings";
import { useTranslation } from "../hooks/useTranslation";
import { Vertical4Icon, Horizontal4Icon, Vertical3Icon, HorizontalLine4Icon } from "./TemplateIcons";
import { useIsMobile } from "./ui/use-mobile";
import { PageHeader } from "./PageHeader";

interface TemplateSelectorProps {
  onSelect: (template: TemplateConfig) => void;
  onBack?: () => void;
  mode: ModeType;
}

const TEMPLATE_ICONS = {
  "vertical-4": Vertical4Icon,
  "vertical-3": Vertical3Icon,
  "vertical-6": Grid3x3,
  "horizontal-4": Horizontal4Icon,
  "horizontal-line-4": HorizontalLine4Icon,
};

const ICON_COLORS = ["bg-stone-900", "bg-stone-700", "bg-stone-600", "bg-stone-500", "bg-stone-400"];

export const TemplateSelector = ({ onSelect, onBack, mode }: TemplateSelectorProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const visibleTemplates = Object.values(TEMPLATES).filter((template) => {
    const setting = getTemplateSetting(template.id, mode);
    return setting.visible;
  });

  if (isMobile) {
    return (
      <div className="h-[calc(100dvh-56px)] flex flex-col bg-[#F3F3F3] overflow-hidden page-enter">
        <div className="w-full h-full flex flex-col p-4">
          <PageHeader title={t.templateSelector.title} subtitle={t.templateSelector.subtitle} />

          <div className="flex-1 grid grid-cols-2 gap-3 content-start overflow-y-auto min-h-0">
            {visibleTemplates.map((template, idx) => {
              const Icon = TEMPLATE_ICONS[template.id];
              const color = ICON_COLORS[idx % ICON_COLORS.length];
              return (
                <button key={template.id} onClick={() => onSelect(template)} className="text-left active:opacity-70 transition-opacity">
                  <div className="h-full p-3 bg-white rounded-2xl flex flex-col items-center text-center shadow-md">
                    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-2`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-stone-900 text-xs font-bold mb-1">{t.templates[template.id]}</h3>
                    <p className="text-stone-400 text-xs font-medium">{template.cuts}{t.templateSelector.photos}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#F3F3F3] overflow-hidden page-enter">
      <div className="w-full h-full flex flex-col justify-center mx-auto">
        <PageHeader title={t.templateSelector.title} subtitle={t.templateSelector.subtitle} />

        <div className="flex-shrink-0 px-6">
          <div className="grid grid-cols-2 gap-5 w-full max-w-3xl mx-auto">
            {visibleTemplates.map((template, idx) => {
              const Icon = TEMPLATE_ICONS[template.id];
              const color = ICON_COLORS[idx % ICON_COLORS.length];
              return (
                <button key={template.id} onClick={() => onSelect(template)} className="text-left group transition-transform hover:-translate-y-1">
                  <div className="p-8 bg-white rounded-2xl cursor-pointer shadow-md group-hover:shadow-xl transition-shadow">
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className={`w-20 h-20 ${color} rounded-xl flex items-center justify-center`}>
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                      <div>
                        <h3 className="mb-1 text-stone-900 text-2xl font-semibold">{t.templates[template.id]}</h3>
                        <p className="text-stone-400 text-base font-medium">{template.cuts}{t.templateSelector.photos}</p>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
