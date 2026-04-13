import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { TemplateType } from "../types/photobooth";
import { getFramesByModeAndTemplate, UploadedFrame } from "../utils/frameStorage";
import { useTranslation } from "../hooks/useTranslation";
import { TEMPLATES } from "../config/templates";
import { useIsMobile } from "./ui/use-mobile";
import { PageHeader } from "./PageHeader";

interface ThemeSelectorProps {
  selectedTemplate: TemplateType;
  templateCuts: number;
  onSelect: (theme: { overlays: string[]; frame: UploadedFrame | null }) => void;
  onBack: () => void;
}

export const ThemeSelector = ({
  selectedTemplate,
  templateCuts,
  onSelect,
  onBack,
}: ThemeSelectorProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [themes, setThemes] = useState<
    { id: string; name: string; overlays: string[]; frame: UploadedFrame | null }[]
  >([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);

  useEffect(() => {
    const frames = getFramesByModeAndTemplate("special", selectedTemplate);
    const enabledFrames = frames.filter((frame) => frame.enabled !== false);

    const themeMap = new Map<string, { overlays: string[]; frame: UploadedFrame | null }>();

    enabledFrames.forEach((frame) => {
      if (!themeMap.has(frame.name)) {
        themeMap.set(frame.name, { overlays: [], frame: null });
      }
      const theme = themeMap.get(frame.name)!;
      if (frame.frameType === "overlay" && frame.overlaySlots) {
        theme.overlays = frame.overlaySlots;
      } else if (frame.frameType === "frame") {
        theme.frame = frame;
      }
    });

    const themeList = Array.from(themeMap.entries()).map(([name, data]) => ({
      id: name,
      name,
      ...data,
    }));

    setThemes(themeList);
    if (themeList.length === 1) setSelectedThemeId(themeList[0].id);
  }, [selectedTemplate]);

  const handleSelect = () => {
    const selectedTheme = themes.find((t) => t.id === selectedThemeId);
    if (selectedTheme) {
      onSelect({ overlays: selectedTheme.overlays, frame: selectedTheme.frame });
    }
  };

  const renderThemePreview = (theme: typeof themes[0]) => (
    <div
      className="w-full bg-stone-100 rounded-lg overflow-hidden relative"
      style={{
        aspectRatio: `${TEMPLATES[selectedTemplate].canvasWidth}/${TEMPLATES[selectedTemplate].canvasHeight}`,
      }}
    >
      {TEMPLATES[selectedTemplate].cutPositions.map((pos, idx) => (
        <div
          key={idx}
          className="absolute bg-stone-300"
          style={{
            left: `${(pos.x / TEMPLATES[selectedTemplate].canvasWidth) * 100}%`,
            top: `${(pos.y / TEMPLATES[selectedTemplate].canvasHeight) * 100}%`,
            width: `${(pos.width / TEMPLATES[selectedTemplate].canvasWidth) * 100}%`,
            height: `${(pos.height / TEMPLATES[selectedTemplate].canvasHeight) * 100}%`,
          }}
        >
          <div className="absolute inset-0 bg-stone-400" />
          {theme.overlays && theme.overlays[idx] && (
            <img
              src={theme.overlays[idx]}
              alt={`Overlay ${idx + 1}`}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </div>
      ))}
      {theme.frame && (
        <img
          src={theme.frame.imageUrl || theme.frame.dataUrl}
          alt="Composite frame"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      )}
    </div>
  );

  const emptyState = (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 className="text-stone-600 mb-1 text-base font-semibold">
        {t.themeSelector.noThemes || "테마가 없습니다"}
      </h3>
      <p className="text-stone-400 text-sm">
        {t.themeSelector.noThemesDescription || "관리자 페이지에서 테마를 추가해주세요"}
      </p>
    </div>
  );

  if (isMobile) {
    return (
      <div className="h-[calc(100dvh-56px)] flex flex-col bg-[#F3F3F3] overflow-hidden">
        <div className="w-full h-full flex flex-col p-4">
          <PageHeader title={t.themeSelector.title} subtitle={t.themeSelector.subtitle} />

          <div className="flex-1 flex flex-col overflow-y-auto gap-2 min-h-0">
            {themes.length === 0 ? emptyState : themes.map((theme) => {
              const isSelected = selectedThemeId === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setSelectedThemeId(theme.id)}
                  className="relative flex-shrink-0 transition-opacity active:opacity-70"
                >
                  <div className={`p-3 border rounded-2xl transition-all ${
                    isSelected
                      ? "bg-rose-50 border-rose-300 shadow-md"
                      : "bg-white border-stone-200 shadow-sm"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-28 rounded-lg overflow-hidden relative flex-shrink-0">
                        {renderThemePreview(theme)}
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="text-stone-800 text-sm font-semibold">{theme.name}</h3>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 bg-rose-400 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex-shrink-0 pt-3">
            <button
              onClick={handleSelect}
              disabled={!selectedThemeId}
              className="w-full bg-rose-400 text-white py-3 rounded-xl font-semibold shadow-sm hover:bg-rose-500 disabled:opacity-40 transition-colors text-sm"
            >
              {t.common.next}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#F3F3F3] overflow-hidden">
      <div className="w-full h-full flex flex-col justify-center">
        <PageHeader title={t.themeSelector.title} subtitle={t.themeSelector.subtitle} />

        <div className="flex-shrink-0 px-6 pb-3">
          {themes.length === 0 ? emptyState : (
            <div className={`flex gap-5 overflow-x-auto pb-2 ${
              themes.length <= 2 ? "justify-center" : "md:grid md:grid-cols-3 md:max-w-5xl md:mx-auto"
            }`}>
              {themes.map((theme) => {
                const isSelected = selectedThemeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedThemeId(theme.id)}
                    className="relative flex-shrink-0 w-[240px] md:w-auto h-fit group transition-transform hover:-translate-y-1"
                  >
                    <div className={`p-4 border rounded-2xl transition-all ${
                      isSelected
                        ? "bg-rose-50 border-rose-300 shadow-lg"
                        : "bg-white border-stone-200 shadow-md group-hover:shadow-lg"
                    }`}>
                      <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-full">
                          <p className="text-xs font-medium text-stone-400 mb-2 uppercase tracking-wider">
                            {t.themeSelector.preview || "미리보기"}
                          </p>
                          {renderThemePreview(theme)}
                        </div>
                        <h3 className="text-stone-800 text-lg font-semibold">{theme.name}</h3>
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-8 h-8 bg-rose-400 rounded-full flex items-center justify-center shadow-sm">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-center px-6 pb-6 pt-3 flex-shrink-0">
          <button
            onClick={handleSelect}
            disabled={!selectedThemeId}
            className="bg-rose-400 text-white px-16 py-4 rounded-xl font-semibold shadow-sm hover:bg-rose-500 disabled:opacity-40 transition-colors text-lg"
          >
            {t.common.next}
          </button>
        </div>
      </div>
    </div>
  );
};
