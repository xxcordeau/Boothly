import { useState, useRef, useEffect, useMemo } from 'react';
import { UploadedFrame, saveFrame, getFrames, deleteFrame, clearAllFrames, uploadFrameImage } from '../../utils/frameStorage';
import { FrameType, ModeType, TemplateType } from '../../types/photobooth';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner@2.0.3';
import { Upload, Trash2, X, Image as ImageIcon, Layers, Frame, RefreshCw } from 'lucide-react';
import { Switch } from '../ui/switch';
import { TEMPLATES } from '../../config/templates';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';

export const FrameManagementPage = () => {
  const [frames, setFrames] = useState<UploadedFrame[]>(getFrames());
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('vertical-4');
  const [frameName, setFrameName] = useState('');
  const [frameImageUrl, setFrameImageUrl] = useState<string | null>(null);
  const [overlaySlots, setOverlaySlots] = useState<(string | null)[]>([]);
  const [currentUploadingSlot, setCurrentUploadingSlot] = useState<number | null>(null);

  const frameFileInputRef = useRef<HTMLInputElement>(null);
  const slotFileInputRef = useRef<HTMLInputElement>(null);

  const templateOptions = [
    { value: 'vertical-4' as TemplateType, label: '네컷 (세로 2x2)', canvasWidth: 1340, canvasHeight: 2080, cuts: 4 },
    { value: 'vertical-3' as TemplateType, label: '세컷 (세로 일렬)', canvasWidth: 1320, canvasHeight: 2060, cuts: 3 },
    { value: 'horizontal-4' as TemplateType, label: '네컷 (가로 2x2)', canvasWidth: 1940, canvasHeight: 1480, cuts: 4 },
    { value: 'horizontal-line-4' as TemplateType, label: '가로 네컷 (일렬)', canvasWidth: 3780, canvasHeight: 860, cuts: 4 },
  ];

  const currentTemplate = templateOptions.find(t => t.value === selectedTemplate)!;
  const templateConfig = TEMPLATES[selectedTemplate];
  const frameWidth = currentTemplate.canvasWidth;
  const frameHeight = currentTemplate.canvasHeight;

  useEffect(() => {
    setOverlaySlots(Array(currentTemplate.cuts).fill(null));
  }, []);

  const handleTemplateChange = (newTemplate: TemplateType) => {
    setSelectedTemplate(newTemplate);
    setFrameImageUrl(null);
    if (frameFileInputRef.current) frameFileInputRef.current.value = '';
    const newConfig = templateOptions.find(t => t.value === newTemplate)!;
    setOverlaySlots(Array(newConfig.cuts).fill(null));
  };

  const handleFrameFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('이미지 파일만 업로드 가능합니다'); return; }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        if (img.width !== frameWidth || img.height !== frameHeight) {
          toast.error(`이미지 크기가 맞지 않습니다. ${frameWidth}x${frameHeight}px 이미지를 업로드해주세요.`);
          if (frameFileInputRef.current) frameFileInputRef.current.value = '';
          return;
        }
        setFrameImageUrl(dataUrl);
        toast.success('프레임 이미지가 로드되었습니다');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSlotFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || currentUploadingSlot === null) return;
    if (!file.type.startsWith('image/')) { toast.error('이미지 파일만 업로드 가능합니다'); return; }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        if (img.width !== 600 || img.height !== 900) {
          toast.error(`이미지 크기가 맞지 않습니다. 600x900px 이미지를 업로드해주세요.`);
          if (slotFileInputRef.current) slotFileInputRef.current.value = '';
          return;
        }
        const newSlots = [...overlaySlots];
        newSlots[currentUploadingSlot] = dataUrl;
        setOverlaySlots(newSlots);
        setCurrentUploadingSlot(null);
        if (slotFileInputRef.current) slotFileInputRef.current.value = '';
        toast.success(`컷 ${currentUploadingSlot + 1} 이미지가 로드되었습니다`);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSlotClick = (index: number) => {
    setCurrentUploadingSlot(index);
    slotFileInputRef.current?.click();
  };

  const handleSlotRemove = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSlots = [...overlaySlots];
    newSlots[index] = null;
    setOverlaySlots(newSlots);
  };

  const handleUpload = async () => {
    if (!frameName.trim()) { toast.error('테마 이름을 입력해주세요'); return; }
    const hasOverlays = overlaySlots.some(slot => slot !== null);
    const hasFrame = frameImageUrl !== null;
    if (!hasOverlays && !hasFrame) { toast.error('오버레이 또는 프레임 이미지를 하나 이상 추가해주세요'); return; }

    try {
      const baseFrameId = `frame-${selectedTemplate}-special-${Date.now()}`;
      toast.loading('테마 업로드 중...');

      if (hasOverlays) {
        const overlayFrameId = `${baseFrameId}-overlay`;
        const uploadedSlots: string[] = [];
        for (let i = 0; i < overlaySlots.length; i++) {
          const slotDataUrl = overlaySlots[i];
          if (slotDataUrl) {
            const { publicUrl } = await uploadFrameImage(slotDataUrl, overlayFrameId, `overlay-slot-${i}.png`);
            uploadedSlots[i] = publicUrl;
          } else {
            uploadedSlots[i] = '';
          }
        }
        await saveFrame({ id: overlayFrameId, name: frameName.trim(), templateType: selectedTemplate, frameType: 'overlay', mode: 'special', overlaySlots: uploadedSlots, enabled: true, uploadedAt: Date.now() });
      }

      if (hasFrame) {
        const compositeFrameId = `${baseFrameId}-frame`;
        const { publicUrl, path } = await uploadFrameImage(frameImageUrl, compositeFrameId, 'frame.png');
        await saveFrame({ id: compositeFrameId, name: frameName.trim(), templateType: selectedTemplate, frameType: 'frame', mode: 'special', imageUrl: publicUrl, storagePath: path, enabled: true, uploadedAt: Date.now() });
      }

      setFrames(getFrames());
      toast.dismiss();
      toast.success(hasOverlays && hasFrame ? '오버레이와 프레임이 업로드되었습니다' : hasOverlays ? '오버레이가 업로드되었습니다' : '프레임이 업로드되었습니다');

      setOverlaySlots(Array(templateConfig.cuts).fill(null));
      setFrameImageUrl(null);
      setFrameName('');
      if (frameFileInputRef.current) frameFileInputRef.current.value = '';
    } catch (error) {
      toast.dismiss();
      toast.error('테마 업로드 실패: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 프레임을 삭제하시겠습니까?')) return;
    await deleteFrame(id);
    setFrames(getFrames());
    toast.success('프레임이 삭제되었습니다');
  };

  const filteredFrames = useMemo(() =>
    frames.filter(f => f.templateType === selectedTemplate && f.mode === 'special'),
    [frames, selectedTemplate]
  );

  const themes = useMemo(() => {
    const groups: Record<string, { name: string; overlays: string[]; frame: UploadedFrame | null }> = {};
    filteredFrames.forEach(frame => {
      if (!groups[frame.name]) groups[frame.name] = { name: frame.name, overlays: [], frame: null };
      if (frame.frameType === 'overlay' && frame.overlaySlots) groups[frame.name].overlays = frame.overlaySlots;
      else if (frame.frameType === 'frame') groups[frame.name].frame = frame;
    });
    return Object.values(groups);
  }, [filteredFrames]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-stone-900 text-2xl font-bold tracking-tight mb-1">스페셜 모드 프레임 관리</h1>
        <p className="text-stone-400 text-sm font-medium">스페셜 모드용 테마 프레임을 업로드하고 관리하세요</p>
      </div>

      {/* Layer System Info */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-sky-100 rounded-xl flex items-center justify-center">
            <Layers className="w-4 h-4 text-sky-600" />
          </div>
          <h3 className="text-stone-900 text-sm font-bold">2가지 레이어 시스템</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex gap-3 p-3 bg-violet-50 rounded-xl">
            <div className="w-7 h-7 bg-violet-400 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[10px] font-bold">O</span>
            </div>
            <div>
              <p className="text-stone-900 text-xs font-bold">오버레이</p>
              <p className="text-stone-500 text-xs font-medium">각 컷마다 다른 이미지 · 600×900px</p>
            </div>
          </div>
          <div className="flex gap-3 p-3 bg-amber-50 rounded-xl">
            <div className="w-7 h-7 bg-amber-400 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[10px] font-bold">F</span>
            </div>
            <div>
              <p className="text-stone-900 text-xs font-bold">프레임</p>
              <p className="text-stone-500 text-xs font-medium">최종 결과물 프레임 · 템플릿별 크기</p>
            </div>
          </div>
        </div>
        <p className="text-stone-400 text-xs font-medium mt-3">같은 테마 이름으로 업로드하면 하나의 테마로 묶입니다.</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-stone-900 text-sm font-bold">새 프레임 업로드</h2>
          <button
            onClick={handleUpload}
            disabled={!frameName.trim() || (overlaySlots.every(s => s === null) && !frameImageUrl)}
            className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            테마 업로드
          </button>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-600 text-xs font-bold uppercase tracking-wider mb-2 block">템플릿</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger className="rounded-xl border-stone-200 bg-stone-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templateOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-stone-600 text-xs font-bold uppercase tracking-wider mb-2 block">테마 이름</Label>
              <Input
                value={frameName}
                onChange={(e) => setFrameName(e.target.value)}
                placeholder="예: 빈티지 필름"
                className="rounded-xl border-stone-200 bg-stone-50 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Overlay Slots */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-violet-400 rounded-lg flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">O</span>
                </div>
                <div>
                  <p className="text-stone-700 text-xs font-bold">오버레이 <span className="text-stone-400 font-medium">(선택사항)</span></p>
                  <p className="text-stone-400 text-[10px] font-medium">600×900px · 컷당 1장</p>
                </div>
              </div>
              <div className={`grid gap-2 ${overlaySlots.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {overlaySlots.map((slot, index) => (
                  <div
                    key={index}
                    onClick={() => handleSlotClick(index)}
                    className="relative border-2 border-dashed border-stone-200 rounded-xl bg-stone-50 aspect-[2/3] cursor-pointer hover:border-violet-300 hover:bg-violet-50/30 transition-all flex items-center justify-center"
                  >
                    {slot ? (
                      <>
                        <img src={slot} alt={`Slot ${index + 1}`} className="max-w-full max-h-full object-contain rounded-lg" />
                        <button
                          onClick={(e) => handleSlotRemove(index, e)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center text-stone-300">
                        <Upload className="w-5 h-5 mx-auto mb-1" />
                        <p className="text-[10px] font-medium">컷 {index + 1}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Composite Frame */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-amber-400 rounded-lg flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">F</span>
                </div>
                <div>
                  <p className="text-stone-700 text-xs font-bold">최종 프레임 <span className="text-stone-400 font-medium">(선택사항)</span></p>
                  <p className="text-stone-400 text-[10px] font-medium">{frameWidth}×{frameHeight}px</p>
                </div>
              </div>
              <div
                onClick={() => frameFileInputRef.current?.click()}
                className="flex-1 min-h-[160px] border-2 border-dashed border-stone-200 rounded-xl bg-stone-50 flex items-center justify-center cursor-pointer hover:border-amber-300 hover:bg-amber-50/20 transition-all"
              >
                {frameImageUrl ? (
                  <div className="relative w-full h-full group p-3">
                    <img src={frameImageUrl} alt="Frame Preview" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-all flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 bg-stone-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg">클릭하여 변경</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-stone-300">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs font-medium">클릭하여 업로드</p>
                    <p className="text-[10px] mt-1">{frameWidth}×{frameHeight}px</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden inputs */}
      <input ref={slotFileInputRef} type="file" accept="image/*" onChange={handleSlotFileSelect} className="hidden" />
      <input ref={frameFileInputRef} type="file" accept="image/*" onChange={handleFrameFileSelect} className="hidden" />

      {/* Uploaded Themes */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div>
            <h2 className="text-stone-900 text-sm font-bold">업로드된 테마</h2>
            <p className="text-stone-400 text-xs font-medium mt-0.5">{currentTemplate.label} · {themes.length}개 테마</p>
          </div>
          <button
            onClick={async () => {
              if (!confirm('기본 테마를 다시 생성하시겠습니까?\n기존 로컬 테마는 모두 삭제되고 Supabase Storage에 새로 업로드됩니다.')) return;
              try {
                localStorage.removeItem('photobooth_custom_frames');
                const { initializeDefaultThemes } = await import('../../utils/defaultThemes');
                await initializeDefaultThemes();
                setFrames([...getFrames()]);
                toast.success('기본 테마가 생성되었습니다');
              } catch (error) {
                toast.error('기본 테마 생성 실패: ' + (error instanceof Error ? error.message : 'Unknown error'));
              }
            }}
            className="flex items-center gap-2 px-4 py-2 border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600 text-xs font-bold rounded-xl transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            기본 테마 재생성
          </button>
        </div>

        {themes.length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon className="w-10 h-10 mx-auto mb-3 text-stone-200" />
            <p className="text-stone-400 text-sm font-medium">이 템플릿에 업로드된 테마가 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {themes.map((theme) => (
              <div key={theme.name} className="p-6">
                <h3 className="text-stone-900 text-sm font-bold mb-4">{theme.name}</h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Overlays */}
                  <div>
                    <p className="text-stone-400 text-[10px] font-bold uppercase tracking-wider mb-2">오버레이</p>
                    {theme.overlays && theme.overlays.length > 0 ? (
                      <div className={`grid gap-2 ${theme.overlays.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                        {theme.overlays.map((url, idx) => (
                          <div key={idx} className="border border-stone-100 rounded-xl bg-stone-50 aspect-[2/3] flex items-center justify-center overflow-hidden">
                            {url ? (
                              <img src={url} alt={`Overlay ${idx + 1}`} className="max-w-full max-h-full object-contain" />
                            ) : (
                              <p className="text-stone-300 text-[10px]">컷 {idx + 1}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border border-dashed border-stone-200 rounded-xl bg-stone-50 h-24 flex items-center justify-center">
                        <p className="text-stone-300 text-xs font-medium">미등록</p>
                      </div>
                    )}
                  </div>

                  {/* Frame */}
                  <div className="flex flex-col">
                    <p className="text-stone-400 text-[10px] font-bold uppercase tracking-wider mb-2">프레임</p>
                    {theme.frame ? (
                      <div className="flex-1 min-h-[120px] border border-stone-100 rounded-xl bg-stone-50 flex items-center justify-center p-3">
                        <img src={theme.frame.imageUrl || theme.frame.dataUrl} alt="Frame" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="flex-1 min-h-[120px] border border-dashed border-stone-200 rounded-xl bg-stone-50 flex items-center justify-center">
                        <p className="text-stone-300 text-xs font-medium">미등록</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Theme Actions */}
                <div className="mt-4 flex items-center justify-between">
                  {(() => {
                    const themeFrames = filteredFrames.filter(f => f.name === theme.name);
                    const isEnabled = themeFrames.some(f => f.enabled !== false);
                    return (
                      <div className="flex items-center gap-2.5">
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={async (checked) => {
                            for (const frame of themeFrames) {
                              await saveFrame({ ...frame, enabled: checked });
                            }
                            setFrames([...getFrames()]);
                            toast.success(checked ? '테마가 활성화되었습니다' : '테마가 비활성화되었습니다');
                          }}
                        />
                        <span className={`text-xs font-semibold ${isEnabled ? 'text-emerald-600' : 'text-stone-400'}`}>
                          {isEnabled ? '활성화됨' : '비활성화됨'}
                        </span>
                      </div>
                    );
                  })()}

                  <button
                    onClick={async () => {
                      if (!confirm(`"${theme.name}" 테마 전체를 삭제하시겠습니까?`)) return;
                      const toDelete = filteredFrames.filter(f => f.name === theme.name);
                      for (const frame of toDelete) await deleteFrame(frame.id);
                      setFrames([...getFrames()]);
                      toast.success('테마가 삭제되었습니다');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
