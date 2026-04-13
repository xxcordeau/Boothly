import { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import { toast } from "sonner@2.0.3";
import {
  LayoutGrid,
  Rows3,
  Layout,
  AlignHorizontalDistributeCenter,
  Eye,
  EyeOff,
  DollarSign,
  Save,
  Palette,
  Sparkles,
  Info,
} from "lucide-react";
import { TEMPLATES } from "../../config/templates";
import { TemplateType, ModeType } from "../../types/photobooth";
import {
  getTemplateSettings,
  updateTemplateSetting,
  TemplateSettings,
} from "../../utils/templateSettings";
import { useTranslation } from "../../hooks/useTranslation";

const TEMPLATE_ICONS: Record<TemplateType, any> = {
  "vertical-4": LayoutGrid,
  "vertical-3": Rows3,
  "vertical-6": LayoutGrid,
  "horizontal-4": Layout,
  "horizontal-line-4": AlignHorizontalDistributeCenter,
};

const ICON_COLORS = ["bg-amber-400", "bg-rose-400", "bg-sky-400", "bg-emerald-400", "bg-violet-400"];

export const TemplateManagementPage = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<TemplateSettings[]>([]);
  const [currentMode, setCurrentMode] = useState<ModeType>("basic");

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = () => {
    setSettings(getTemplateSettings());
  };

  const handleVisibilityChange = (templateId: TemplateType, mode: ModeType, visible: boolean) => {
    const newSettings = settings.map((s) =>
      s.templateId === templateId && s.mode === mode ? { ...s, visible } : s,
    );
    setSettings(newSettings);
    updateTemplateSetting(templateId, mode, { visible });
    const modeText = mode === "basic" ? t.templateManagement.basic : t.templateManagement.special;
    const statusText = visible ? t.templateManagement.visible : t.templateManagement.hidden;
    toast.success(`${TEMPLATES[templateId].name} (${modeText}) ${statusText} ${t.templateManagement.settingComplete}`);
  };

  const handlePriceChange = (templateId: TemplateType, mode: ModeType, priceStr: string) => {
    const price = parseInt(priceStr);
    if (isNaN(price) || price < 0) return;
    const newSettings = settings.map((s) =>
      s.templateId === templateId && s.mode === mode ? { ...s, basePrice: price } : s,
    );
    setSettings(newSettings);
  };

  const handlePriceSave = (templateId: TemplateType, mode: ModeType) => {
    const setting = settings.find((s) => s.templateId === templateId && s.mode === mode);
    if (!setting) return;
    updateTemplateSetting(templateId, mode, { basePrice: setting.basePrice });
    const modeText = mode === "basic" ? t.templateManagement.basic : t.templateManagement.special;
    toast.success(`${TEMPLATES[templateId].name} (${modeText}) ${t.templateManagement.priceSaved}`);
  };

  const getSetting = (templateId: TemplateType, mode: ModeType): TemplateSettings =>
    settings.find((s) => s.templateId === templateId && s.mode === mode) || {
      templateId, mode, visible: true, basePrice: mode === "basic" ? 5000 : 7000,
    };

  const getModeStats = (mode: ModeType) => {
    const modeSettings = settings.filter((s) => s.mode === mode);
    return {
      total: modeSettings.length,
      visible: modeSettings.filter((s) => s.visible).length,
      hidden: modeSettings.filter((s) => !s.visible).length,
    };
  };

  const renderTemplateList = (mode: ModeType) => {
    const stats = getModeStats(mode);
    const modeColor = mode === "basic" ? "amber" : "violet";

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 ${mode === "basic" ? "bg-amber-400" : "bg-violet-400"} rounded-xl flex items-center justify-center`}>
                <LayoutGrid className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-stone-400 text-xs font-semibold">{t.templateManagement.totalTemplates}</p>
                <p className="text-stone-900 text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-400 rounded-xl flex items-center justify-center">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-stone-400 text-xs font-semibold">{t.templateManagement.visibleTemplates}</p>
                <p className="text-stone-900 text-2xl font-bold">{stats.visible}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-stone-300 rounded-xl flex items-center justify-center">
                <EyeOff className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-stone-400 text-xs font-semibold">{t.templateManagement.hiddenTemplates}</p>
                <p className="text-stone-900 text-2xl font-bold">{stats.hidden}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Templates List */}
        <div className="space-y-4">
          {Object.values(TEMPLATES).map((template, idx) => {
            const Icon = TEMPLATE_ICONS[template.id];
            const setting = getSetting(template.id, mode);
            const color = ICON_COLORS[idx % ICON_COLORS.length];

            return (
              <div
                key={`${template.id}-${mode}`}
                className={`bg-white rounded-2xl p-5 shadow-sm transition-all ${!setting.visible ? "opacity-60" : ""}`}
              >
                <div className="flex flex-col sm:flex-row items-start gap-5">
                  {/* Icon */}
                  <div className={`w-12 h-12 ${setting.visible ? color : "bg-stone-200"} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-stone-900 text-sm font-bold">{template.name}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        setting.visible ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500"
                      }`}>
                        {setting.visible ? t.templateManagement.visible : t.templateManagement.hidden}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        mode === "basic" ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700"
                      }`}>
                        {mode === "basic" ? t.templateManagement.basic : t.templateManagement.special}
                      </span>
                    </div>
                    <p className="text-stone-500 text-xs font-medium mb-0.5">
                      {template.cuts}{t.templateManagement.photoCount}
                      {template.id === "vertical-4" && ` (${t.templateManagement.gridLayout})`}
                      {template.id === "horizontal-4" && ` (${t.templateManagement.gridLayout})`}
                      {template.id === "vertical-6" && ` (${t.templateManagement.grid23Layout})`}
                      {template.id === "horizontal-line-4" && ` (${t.templateManagement.lineLayout})`}
                      {template.id === "vertical-3" && ` (${t.templateManagement.lineLayout})`}
                    </p>
                    <p className="text-stone-300 text-xs font-medium">
                      {t.templateManagement.canvasSize}: {template.canvasWidth}×{template.canvasHeight}px
                    </p>

                    {/* Settings Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {/* Visibility */}
                      <div>
                        <Label className="flex items-center gap-1.5 text-stone-600 text-xs font-bold uppercase tracking-wider mb-2">
                          {setting.visible ? <Eye className="w-3.5 h-3.5 text-emerald-500" /> : <EyeOff className="w-3.5 h-3.5 text-stone-400" />}
                          {t.templateManagement.displayOnScreen}
                        </Label>
                        <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                          <Switch
                            checked={setting.visible}
                            onCheckedChange={(checked) => handleVisibilityChange(template.id, mode, checked)}
                          />
                          <span className="text-stone-600 text-xs font-semibold">
                            {setting.visible ? t.templateManagement.visibleToUsers : t.templateManagement.hiddenFromUsers}
                          </span>
                        </div>
                      </div>

                      {/* Price */}
                      <div>
                        <Label className="flex items-center gap-1.5 text-stone-600 text-xs font-bold uppercase tracking-wider mb-2">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                          {t.templateManagement.basePricePerSheet}
                        </Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              type="number"
                              min="0"
                              step="1000"
                              value={setting.basePrice}
                              onChange={(e) => handlePriceChange(template.id, mode, e.target.value)}
                              className="pr-10 rounded-xl border-stone-200 bg-stone-50"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-medium">
                              {t.printCount.price}
                            </span>
                          </div>
                          <button
                            onClick={() => handlePriceSave(template.id, mode)}
                            className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white px-4 rounded-xl text-xs font-bold transition-colors shadow-sm"
                          >
                            <Save className="w-3.5 h-3.5" />
                            {t.templateManagement.save}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-stone-900 text-2xl font-bold tracking-tight mb-1">{t.templateManagement.title}</h1>
        <p className="text-stone-400 text-sm font-medium">{t.templateManagement.subtitle}</p>
      </div>

      {/* Mode Tabs */}
      <Tabs value={currentMode} onValueChange={(v) => setCurrentMode(v as ModeType)}>
        <TabsList className="grid w-full max-w-sm grid-cols-2 mb-6 h-12 p-1 bg-white shadow-sm rounded-2xl">
          <TabsTrigger
            value="basic"
            className="gap-2 rounded-xl text-sm font-bold data-[state=active]:bg-amber-400 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <Palette className="w-4 h-4" />
            {t.templateManagement.basicMode}
          </TabsTrigger>
          <TabsTrigger
            value="special"
            className="gap-2 rounded-xl text-sm font-bold data-[state=active]:bg-violet-400 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            {t.templateManagement.specialMode}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic">{renderTemplateList("basic")}</TabsContent>
        <TabsContent value="special">{renderTemplateList("special")}</TabsContent>
      </Tabs>

      {/* Info Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-sky-100 rounded-xl flex items-center justify-center">
            <Info className="w-4 h-4 text-sky-600" />
          </div>
          <h3 className="text-stone-900 text-sm font-bold">{t.templateManagement.infoTitle}</h3>
        </div>
        <ul className="space-y-2">
          {[
            { label: t.templateManagement.modeSettings, desc: t.templateManagement.modeSettingsDesc },
            { label: t.templateManagement.displayOnScreen, desc: t.templateManagement.displayDesc },
            { label: t.templateManagement.basePrice, desc: t.templateManagement.basePriceDesc },
            { label: t.templateManagement.reset, desc: `${t.templateManagement.resetDesc} 스페셜: 7,000원)` },
            { label: '권장사항', desc: '각 모드별로 최소 1개 이상의 템플릿은 표시 상태로 유지하는 것을 권장합니다.' },
          ].map(({ label, desc }, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 bg-sky-400 rounded-full mt-1.5 flex-shrink-0" />
              <p className="text-stone-500 text-xs font-medium leading-relaxed">
                <span className="text-stone-700 font-bold">{label}: </span>{desc}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
