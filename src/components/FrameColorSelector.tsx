import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Check } from 'lucide-react';
import type { CapturedPhoto, FilterType, TemplateConfig } from '../types/photobooth';
import { Sun, Sparkles, ImageIcon } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { composePhotos as composePhotosFunction } from '../hooks/usePhotoComposer';
import { useIsMobile } from './ui/use-mobile';
import { usePhotoBoothContext } from '../contexts/PhotoBoothContext';

export interface FrameColorOption {
  id: string;
  name: string;
  colors: {
    outer: string;
    inner: string;
  };
}

export const FRAME_COLOR_OPTIONS: FrameColorOption[] = [
  { id: 'black', name: 'black', colors: { outer: '#1A1A1A', inner: '#2D2D2D' } },
  { id: 'white', name: 'white', colors: { outer: '#FFFFFF', inner: '#F8F9FA' } },
  { id: 'gray', name: 'gray', colors: { outer: '#6B7280', inner: '#9CA3AF' } },
  { id: 'beige', name: 'beige', colors: { outer: '#F5F5DC', inner: '#FAEBD7' } },
  { id: 'pink', name: 'pink', colors: { outer: '#FFC0CB', inner: '#FFE4E1' } },
  { id: 'blue', name: 'blue', colors: { outer: '#3B82F6', inner: '#60A5FA' } },
  { id: 'purple', name: 'purple', colors: { outer: '#8B5CF6', inner: '#A78BFA' } },
  { id: 'red', name: 'red', colors: { outer: '#EF4444', inner: '#F87171' } },
  { id: 'yellow', name: 'yellow', colors: { outer: '#F59E0B', inner: '#FCD34D' } },
  { id: 'navy', name: 'navy', colors: { outer: '#1E3A8A', inner: '#3B82F6' } },
  { id: 'green', name: 'green', colors: { outer: '#10B981', inner: '#34D399' } },
  { id: 'brown', name: 'brown', colors: { outer: '#92400E', inner: '#B45309' } },
  { id: 'mint', name: 'mint', colors: { outer: '#5EEAD4', inner: '#99F6E4' } },
];

const FILTER_OPTIONS = [
  { id: 'normal' as FilterType, name: 'normal', icon: ImageIcon },
  { id: 'bright' as FilterType, name: 'bright', icon: Sun },
  { id: 'grayscale' as FilterType, name: 'grayscale', icon: Sparkles },
];

interface FrameColorSelectorProps {
  onSelect: (frameColors: FrameColorOption, filter: FilterType, selectedPhotos?: (CapturedPhoto | null)[], includeQR?: boolean, includeDate?: boolean) => void;
  onBack?: () => void;
  selectedTemplate?: TemplateConfig;
  capturedPhotos: CapturedPhoto[];
  mode?: 'basic' | 'special';
}

export const FrameColorSelector = ({ onSelect, onBack, selectedTemplate, capturedPhotos, mode = 'basic' }: FrameColorSelectorProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { selectionTimeRemaining, setSelectionTimeRemaining } = usePhotoBoothContext();
  const [selectedColor, setSelectedColor] = useState<string>(FRAME_COLOR_OPTIONS[0].id);
  // For special mode, always use 'normal' filter (no filter applied)
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('normal');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoSelected = useRef(false);
  const [includeQR, setIncludeQR] = useState(false);
  const [includeDate, setIncludeDate] = useState(false);
  
  // Mobile step state: 1 = photo selection, 2 = options (frame color, filter, etc.)
  const [mobileStep, setMobileStep] = useState<1 | 2>(1);
  
  // Photo selection state - frame slots, each slot can hold a photo ID or null
  const requiredPhotoCount = selectedTemplate?.cuts || 4;
  const [frameSlots, setFrameSlots] = useState<(number | null)[]>(
    Array(requiredPhotoCount).fill(null)
  );
  
  // Currently selected photo (before placing in frame)
  const [selectedPhotoId, setSelectedPhotoId] = useState<number | null>(null);

  // Calculate aspect ratio from template
  const photoAspectRatio = selectedTemplate?.cutPositions[0] 
    ? selectedTemplate.cutPositions[0].width / selectedTemplate.cutPositions[0].height 
    : 2/3; // default to 2:3

  // No auto-select - users must manually select photos

  // Initialize timer on mount
  useEffect(() => {
    setSelectionTimeRemaining(100);
    return () => {
      setSelectionTimeRemaining(null);
    };
  }, [setSelectionTimeRemaining]);

  // Timer countdown
  useEffect(() => {
    if (selectionTimeRemaining === null) return;
    
    timerRef.current = setInterval(() => {
      setSelectionTimeRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          // Auto-proceed if time runs out
          // Use setTimeout to defer the callback and avoid updating during render
          setTimeout(() => {
            const selected = FRAME_COLOR_OPTIONS.find((option) => option.id === selectedColor);
            if (selected) {
              const selectedPhotos = frameSlots
                .map(id => id ? capturedPhotos.find(p => p.id === id) : null)
                .map(p => p || null);
              const filterToUse = mode === 'special' ? 'normal' : selectedFilter;
              onSelect(selected, filterToUse, selectedPhotos, includeQR, includeDate);
            }
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [selectionTimeRemaining, setSelectionTimeRemaining, selectedColor, selectedFilter, frameSlots, capturedPhotos, onSelect, mode, includeQR, includeDate]);

  // Photo click handler - toggle selection
  const handlePhotoClick = (e: React.MouseEvent, photoId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isInFrame = frameSlots.includes(photoId);
    
    if (isInFrame) {
      // Remove from frame
      setFrameSlots(prev => prev.map(id => id === photoId ? null : id));
      setSelectedPhotoId(null);
    } else {
      // Select for placement
      setSelectedPhotoId(photoId);
    }
  };

  // Frame slot click handler
  const handleFrameSlotClick = (e: React.MouseEvent, slotIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const currentPhotoId = frameSlots[slotIndex];
    
    if (currentPhotoId !== null) {
      // Remove photo from this slot
      setFrameSlots(prev => {
        const newSlots = [...prev];
        newSlots[slotIndex] = null;
        return newSlots;
      });
    } else if (selectedPhotoId !== null) {
      // Place selected photo in this slot
      // First, remove this photo from any other slot
      setFrameSlots(prev => {
        const newSlots = prev.map(id => id === selectedPhotoId ? null : id);
        newSlots[slotIndex] = selectedPhotoId;
        return newSlots;
      });
      setSelectedPhotoId(null); // Clear selection after placement
    }
  };

  const handleSelect = () => {
    console.log('🎯 handleSelect called in FrameColorSelector');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      console.log('⏹️ Timer cleared');
    }
    
    const selected = FRAME_COLOR_OPTIONS.find((option) => option.id === selectedColor);
    console.log('🎨 Selected frame color:', selected?.id);
    
    if (selected) {
      // Pass selected photos to parent in frame order (preserving null for empty slots)
      const selectedPhotos = frameSlots
        .map(id => id ? capturedPhotos.find(p => p.id === id) : null)
        .map(p => p || null); // Ensure undefined becomes null
      
      console.log('📸 Selected photos for composition:', {
        totalSlots: frameSlots.length,
        filledSlots: selectedPhotos.filter(p => p !== null).length,
        frameSlots,
        selectedPhotos: selectedPhotos.map((p, i) => ({ index: i, hasPhoto: !!p }))
      });
      
      // For special mode, always use 'normal' filter (no filter)
      // For basic mode, use user-selected filter
      const filterToUse = mode === 'special' ? 'normal' : selectedFilter;
      console.log('🎨 Filter to use:', filterToUse, '(mode:', mode + ')');
      
      console.log('📞 Calling onSelect callback with:', {
        frameColor: selected.id,
        filter: filterToUse,
        photosCount: selectedPhotos.length,
        includeQR,
        includeDate
      });
      
      onSelect(selected, filterToUse, selectedPhotos, includeQR, includeDate);
      console.log('✅ onSelect callback executed');
    } else {
      console.error('❌ No frame color selected!');
    }
  };

  // Generate preview when color, filter, frame slots, QR option, or date option changes
  useEffect(() => {
    // Always generate preview (even with no photos to show empty frame)
    generatePreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColor, selectedFilter, frameSlots, mode, includeQR, includeDate]);

  const generatePreview = async () => {
    const hasAnyPhotos = frameSlots.some(id => id !== null);
    console.log('🎨 Generating preview...', {
      hasTemplate: !!selectedTemplate,
      photosCount: capturedPhotos.length,
      frameSlots,
      hasAnyPhotos,
      selectedColor,
      selectedFilter,
      includeQR,
      includeDate
    });
    
    if (!selectedTemplate) {
      console.warn('Cannot generate preview: missing template');
      setPreviewImageUrl(null);
      return;
    }
    
    setIsGeneratingPreview(true);
    
    try {
      const { generateCustomFrame } = await import('../utils/generateCustomFrame');
      const { getFrameByTemplateAndType } = await import('../utils/frameStorage');
      const QRCode = (await import('qrcode')).default;
      
      let template = { ...selectedTemplate };
      
      // For special mode, use template's existing frames (from theme selection)
      // For basic mode, always generate frame with selected color (never use uploaded frames)
      if (mode === 'basic') {
        const selectedOption = FRAME_COLOR_OPTIONS.find((option) => option.id === selectedColor);
        if (!selectedOption) return;
        
        // Always generate composite frame with selected color
        const compositeFrameUrl = await generateCustomFrame(
          template.canvasWidth,
          template.canvasHeight,
          selectedOption
        );
        template = { ...template, compositeFrameUrl };
      }
      // For special mode, template already has the theme frames set

      // Get selected photos in frame order (preserving null for empty slots)
      const selectedPhotos = frameSlots
        .map(id => id ? capturedPhotos.find(p => p.id === id) : null)
        .map(p => p || null); // Ensure undefined becomes null

      // Compose photos with selected filter (normal for special mode, user-selected for basic)
      const filterToUse = mode === 'special' ? 'normal' : selectedFilter;
      
      console.log('🎨 Calling composePhotos with:', {
        photosCount: selectedPhotos.length,
        template: template.id,
        filter: filterToUse,
        includeQR,
        includeDate
      });
      
      // Generate dummy QR code for preview if QR option is enabled
      let dummyQrCode: string | undefined = undefined;
      if (includeQR) {
        try {
          console.log('🔲 Generating dummy QR code for preview...');
          dummyQrCode = await QRCode.toDataURL('https://example.com/preview', {
            width: 200,
            margin: 1,
            errorCorrectionLevel: 'M',
            type: 'image/png',
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          });
          console.log('✅ Dummy QR code generated for preview');
        } catch (qrError) {
          console.error('❌ Failed to generate dummy QR code:', qrError);
          dummyQrCode = undefined;
        }
      }
      
      const result = await composePhotosFunction(selectedPhotos, template, filterToUse, undefined, dummyQrCode, includeDate, mode);
      console.log('✅ Preview generated successfully');
      
      setPreviewImageUrl(result);
    } catch (err) {
      console.error('Failed to generate preview:', err);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const selectedOption = FRAME_COLOR_OPTIONS.find((option) => option.id === selectedColor);

  // Mobile view with two steps
  if (isMobile) {
    return (
      <div className="h-[calc(100dvh-56px)] flex flex-col bg-[#F3F3F3] overflow-hidden">
        <div className="w-full h-full flex flex-col p-4">

          {mobileStep === 1 ? (
            // Step 1: Photo Selection
            <>
              {/* Preview - Compact at Top */}
              <div className="flex-shrink-0 bg-white rounded-xl shadow-sm mb-3 overflow-hidden">
                <div className="flex items-stretch" style={{ height: '160px' }}>
                  {/* Preview Image */}
                  <div className="flex-1 flex items-center justify-center bg-stone-50 p-2">
                    {isGeneratingPreview ? (
                      <div className="text-center">
                        <div className="w-6 h-6 border-2 border-rose-400 border-t-transparent rounded-full animate-spin mx-auto mb-1" />
                        <p className="text-stone-400 text-xs">{t.common.loading}</p>
                      </div>
                    ) : previewImageUrl ? (
                      <div
                        className="relative"
                        style={{
                          aspectRatio: selectedTemplate ? `${selectedTemplate.canvasWidth} / ${selectedTemplate.canvasHeight}` : 'auto',
                          height: '140px',
                        }}
                      >
                        <img 
                          src={previewImageUrl} 
                          alt="Preview" 
                          className="w-full h-full rounded-lg shadow-lg block object-contain"
                        />
                        {/* Clickable overlays on preview image */}
                        <div className="absolute inset-0">
                          {selectedTemplate && selectedTemplate.cutPositions.map((pos, idx) => {
                            const photoId = frameSlots[idx];
                            
                            return (
                              <button
                                key={idx}
                                onClick={(e) => handleFrameSlotClick(e, idx)}
                                className={`absolute transition-all flex items-center justify-center ${
                                  photoId 
                                    ? 'cursor-pointer active:ring-2 active:ring-red-400 active:ring-inset active:bg-black/20' 
                                    : selectedPhotoId
                                    ? 'cursor-pointer border-2 border-dashed border-amber-300 bg-white/80 active:bg-white active:border-amber-400'
                                    : 'border-2 border-dashed border-gray-300 bg-white/60 pointer-events-none'
                                }`}
                                style={{
                                  left: `${(pos.x / selectedTemplate.canvasWidth) * 100}%`,
                                  top: `${(pos.y / selectedTemplate.canvasHeight) * 100}%`,
                                  width: `${(pos.width / selectedTemplate.canvasWidth) * 100}%`,
                                  height: `${(pos.height / selectedTemplate.canvasHeight) * 100}%`,
                                }}
                              >
                                {photoId ? (
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 active:opacity-100 transition-opacity">
                                    <div className="bg-red-500 rounded-full p-2 shadow-xl">
                                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </div>
                                  </div>
                                ) : selectedPhotoId ? (
                                  <div className="flex flex-col items-center justify-center gap-1">
                                    <div className="bg-amber-400 rounded-full p-1.5 shadow-lg">
                                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                      </svg>
                                    </div>
                                    <span className="text-xs font-medium text-amber-600">
                                      {t.frameColor.placeHere}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs font-medium text-gray-500">
                                    {t.frameColor.emptyFrame}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  {/* Right: counter info */}
                  <div className="flex-shrink-0 flex flex-col items-center justify-center px-4 bg-white border-l border-stone-100 gap-1" style={{ minWidth: '72px' }}>
                    <p className="text-stone-900 text-2xl font-bold leading-none">{frameSlots.filter(id => id !== null).length}</p>
                    <p className="text-stone-400 text-xs">/ {requiredPhotoCount}</p>
                    <p className="text-stone-400 text-[10px] font-medium text-center">{t.frameColor.selectedCount}</p>
                  </div>
                </div>
              </div>

              {/* Photo Grid */}
              <div className="flex-1 min-h-0 mb-3 overflow-y-auto">
                <div className="bg-white rounded-xl p-3 shadow-sm">
                  <div className="grid grid-cols-3 gap-2">
                    {capturedPhotos.map((photo, index) => {
                      const isInFrame = frameSlots.includes(photo.id);
                      const slotIndex = frameSlots.indexOf(photo.id);
                      const isCurrentlySelected = selectedPhotoId === photo.id;
                      
                      return (
                        <button
                          key={photo.id}
                          onClick={(e) => handlePhotoClick(e, photo.id)}
                          style={{ aspectRatio: photoAspectRatio }}
                          className={`relative rounded-lg overflow-hidden transition-all border-2 ${
                            isCurrentlySelected
                              ? 'ring-2 ring-amber-400 border-amber-400'
                              : isInFrame
                              ? 'ring-2 ring-rose-300 border-rose-300 opacity-90'
                              : 'border-stone-200'
                          }`}
                        >
                          <img 
                            src={photo.imageData} 
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {isCurrentlySelected && (
                            <div className="absolute inset-0 bg-amber-400/30 flex items-center justify-center">
                              <div className="bg-amber-400 rounded-full p-1.5 shadow-lg">
                                <Check className="w-4 h-4 text-white stroke-[3]" />
                              </div>
                            </div>
                          )}
                          {isInFrame && !isCurrentlySelected && (
                            <div className="absolute top-1 right-1 bg-rose-400 rounded-full w-5 h-5 flex items-center justify-center text-white shadow-md text-xs font-bold">
                              {slotIndex + 1}
                            </div>
                          )}
                          <div className="absolute bottom-1 left-1 bg-black/60 text-white px-1.5 py-0.5 rounded text-xs">
                            #{index + 1}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Next Button */}
              <Button
                onClick={() => setMobileStep(2)}
                disabled={frameSlots.filter(id => id !== null).length !== requiredPhotoCount}
                className="w-full bg-rose-400 hover:bg-rose-500 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-xl h-12 text-base font-bold flex-shrink-0"
              >
                {t.common.next || '다음'} {frameSlots.filter(id => id !== null).length !== requiredPhotoCount && `(${frameSlots.filter(id => id !== null).length}/${requiredPhotoCount})`}
              </Button>
            </>
          ) : (
            // Step 2: Frame Color, Filter, QR, Date Options
            <>
              {/* Preview - Compact */}
              <div className="flex-shrink-0 bg-white rounded-xl shadow-sm mb-2 flex items-center justify-center p-2" style={{ height: '120px' }}>
                {isGeneratingPreview ? (
                  <div className="text-center">
                    <div className="w-5 h-5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin mx-auto mb-1" />
                    <p className="text-stone-400 text-xs">{t.common.loading}</p>
                  </div>
                ) : previewImageUrl ? (
                  <img
                    src={previewImageUrl}
                    alt="Preview"
                    className="h-full w-auto rounded-lg shadow-sm object-contain"
                  />
                ) : null}
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto mb-2">
                <div className="space-y-2">
                  {/* Frame Color Selection - Only for Basic Mode */}
                  {mode === 'basic' && (
                    <div className="bg-white rounded-xl p-2.5 shadow-sm border border-stone-200">
                      <h3 className="text-stone-700 mb-1.5 text-xs font-bold">{t.frameColor.frameColor}</h3>
                      
                      <div className="grid grid-cols-5 gap-2">
                        {FRAME_COLOR_OPTIONS.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => setSelectedColor(option.id)}
                            className="flex flex-col items-center gap-1"
                          >
                            <div className="relative">
                              <div
                                className={`w-12 h-12 rounded-xl transition-all border-2 ${
                                  selectedColor === option.id
                                    ? 'border-amber-500 shadow-md scale-105'
                                    : 'border-stone-200'
                                }`}
                                style={{
                                  background: option.colors.outer,
                                }}
                              />

                              {selectedColor === option.id && (
                                <div className="absolute -top-0.5 -right-0.5 bg-amber-500 rounded-full p-0.5">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>

                            <span className="text-[11px] text-slate-600 whitespace-nowrap font-medium">
                              {t.frameColor[option.id as keyof typeof t.frameColor] || option.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Filter Selection - Only for Basic Mode */}
                  {mode === 'basic' && (
                    <div className="bg-white rounded-xl p-2.5 shadow-sm border border-stone-200">
                      <h3 className="text-stone-700 mb-1.5 text-xs font-bold">{t.frameColor.filterOptions}</h3>
                      
                      <div className="flex gap-1.5">
                        {FILTER_OPTIONS.map((filter) => {
                          const Icon = filter.icon;
                          return (
                            <button
                              key={filter.id}
                              onClick={() => setSelectedFilter(filter.id)}
                              className={`flex-1 flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all border-2 ${
                                selectedFilter === filter.id
                                  ? 'bg-amber-50 border-amber-400'
                                  : 'bg-stone-50 border-stone-200'
                              }`}
                            >
                              <Icon 
                                className={`w-4 h-4 ${
                                  selectedFilter === filter.id ? 'text-amber-600' : 'text-stone-400'
                                }`} 
                              />
                              <span className={`text-xs ${
                                selectedFilter === filter.id ? 'text-amber-700 font-bold' : 'text-stone-500'
                              }`}>
                                {filter.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* QR Code Option */}
                  <div className="bg-white rounded-xl p-2.5 shadow-sm border border-stone-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-stone-700 text-xs font-bold">{t.frameColor.qrCode}</h3>
                        <p className="text-stone-400 text-[10px]">{t.frameColor.includeQR}</p>
                      </div>
                      <button
                        onClick={() => setIncludeQR(!includeQR)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          includeQR ? 'bg-amber-400' : 'bg-stone-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            includeQR ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Date Option */}
                  <div className="bg-white rounded-xl p-2.5 shadow-sm border border-stone-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-stone-700 text-xs font-bold">{t.frameColor.shootingDate}</h3>
                        <p className="text-stone-400 text-[10px]">{t.frameColor.includeDate}</p>
                      </div>
                      <button
                        onClick={() => setIncludeDate(!includeDate)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          includeDate ? 'bg-amber-400' : 'bg-stone-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            includeDate ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  onClick={() => setMobileStep(1)}
                  variant="outline"
                  className="flex-1 border-slate-300 text-stone-700 hover:bg-slate-100 rounded-xl h-11 text-sm font-bold"
                >
                  {t.common.back || '이전'}
                </Button>
                <Button
                  onClick={handleSelect}
                  className="flex-[2] bg-rose-400 hover:bg-rose-500 text-white shadow-sm transition-colors rounded-xl h-11 text-sm font-bold"
                >
                  {t.frameColor.complete}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Desktop view (original single-page layout)
  return (
    <div className={`h-[calc(100vh-56px)] flex flex-col bg-[#F3F3F3] p-2 overflow-hidden`}>
      <div className="flex-1 flex gap-5 max-w-[1600px] mx-auto w-full overflow-hidden">
        {/* Left Column: Photo Selection + Frame Color + Filter */}
        <div className="flex-1 flex flex-col gap-2 min-w-0 overflow-hidden">
          {/* Photo Selection */}
          <div className="bg-white rounded-xl p-1.5 shadow-sm border border-stone-200 flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="mb-1 flex-shrink-0">
              <h3 className="text-stone-700" style={{ fontSize: '12px', fontWeight: '600' }}>
                {t.frameColor.photoSelection} <span className="text-stone-400" style={{ fontSize: '11px', fontWeight: '500' }}>{frameSlots.filter(id => id !== null).length} / {requiredPhotoCount} {t.frameColor.selectedCount}</span>
              </h3>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="grid grid-cols-4 gap-1">
              {capturedPhotos.map((photo, index) => {
                const isInFrame = frameSlots.includes(photo.id);
                const slotIndex = frameSlots.indexOf(photo.id);
                const isCurrentlySelected = selectedPhotoId === photo.id;
                
                return (
                  <button
                    key={photo.id}
                    onClick={(e) => handlePhotoClick(e, photo.id)}
                    style={{ aspectRatio: photoAspectRatio }}
                    className={`relative rounded-lg overflow-hidden transition-all border-2 ${
                      isCurrentlySelected
                        ? 'ring-2 ring-amber-400 border-amber-400'
                        : isInFrame
                        ? 'ring-2 ring-rose-300 border-rose-300 opacity-90'
                        : 'border-stone-200 hover:border-amber-200'
                    }`}
                  >
                    <img 
                      src={photo.imageData} 
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {isCurrentlySelected && (
                      <div className="absolute inset-0 bg-amber-400/30 flex items-center justify-center">
                        <div className="bg-amber-400 rounded-full p-1.5 shadow-lg">
                          <Check className="w-4 h-4 text-white stroke-[3]" />
                        </div>
                      </div>
                    )}
                    {isInFrame && !isCurrentlySelected && (
                      <div className="absolute top-1 right-1 bg-slate-700 rounded-full w-6 h-6 flex items-center justify-center text-white shadow-md" style={{ fontSize: '12px', fontWeight: '700' }}>
                        {slotIndex + 1}
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white px-1.5 py-0.5 rounded" style={{ fontSize: '10px', fontWeight: '600' }}>
                      #{index + 1}
                    </div>
                  </button>
                );
              })}
            </div>
            </div>
          </div>

          {/* Frame Color Selection - Only for Basic Mode */}
          {mode === 'basic' && (
            <div className="bg-white rounded-xl p-3 shadow-sm border border-stone-200 flex-shrink-0" style={{ width: '100%' }}>
              <h3 className="text-stone-700 mb-2 px-0.5" style={{ fontSize: '13px', fontWeight: '600' }}>{t.frameColor.frameColor}</h3>

              <div className="flex flex-wrap gap-2 justify-start">
                {FRAME_COLOR_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedColor(option.id)}
                    className="flex flex-col items-center gap-1 group relative flex-shrink-0"
                  >
                    <div className="relative">
                      <div
                        className={`w-11 h-11 rounded-xl transition-all border-2 ${
                          selectedColor === option.id
                            ? 'border-amber-500 shadow-md scale-105'
                            : 'border-stone-200 hover:border-slate-300'
                        }`}
                        style={{
                          background: option.colors.outer,
                        }}
                      />

                      {selectedColor === option.id && (
                        <div className="absolute -top-0.5 -right-0.5 bg-amber-500 rounded-full p-0.5">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    <span style={{ fontSize: '10px' }} className="text-slate-600 whitespace-nowrap font-medium">
                      {t.frameColor[option.id as keyof typeof t.frameColor] || option.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filter Selection - Only for Basic Mode */}
          {mode === 'basic' && (
            <div className="bg-white rounded-xl p-1.5 shadow-sm border border-stone-200 flex-shrink-0" style={{ width: '100%' }}>
              <h3 className="text-stone-700 mb-1 px-0.5" style={{ fontSize: '12px', fontWeight: '600' }}>{t.frameColor.filterOptions}</h3>
              
              <div className="flex gap-1.5">
                {FILTER_OPTIONS.map((filter) => {
                  const Icon = filter.icon;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      className={`flex-1 flex flex-col items-center gap-1 px-1.5 py-1.5 rounded-lg transition-all border-2 ${
                        selectedFilter === filter.id
                          ? 'bg-amber-50 border-amber-400 shadow-sm'
                          : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <Icon 
                        className={`w-5 h-5 ${
                          selectedFilter === filter.id ? 'text-amber-600' : 'text-stone-400'
                        }`} 
                      />
                      <span style={{ fontSize: '10px' }} className={`font-semibold ${
                        selectedFilter === filter.id ? 'text-amber-700' : 'text-slate-600'
                      }`}>
                        {filter.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* QR Code & Date Options - PC only */}
          {!isMobile && (
            <div className="grid grid-cols-2 gap-2 flex-shrink-0">
              {/* QR Code Option */}
              <div className="bg-white rounded-xl p-2.5 shadow-sm border border-stone-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-stone-700 mb-0.5" style={{ fontSize: '12px', fontWeight: '600' }}>{t.frameColor.qrCode}</h3>
                    <p className="text-stone-400" style={{ fontSize: '9px' }}>{t.frameColor.includeQR}</p>
                  </div>
                  <button
                    onClick={() => setIncludeQR(!includeQR)}
                    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                      includeQR ? 'bg-amber-400' : 'bg-stone-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${
                        includeQR ? 'translate-x-4.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Date Option */}
              <div className="bg-white rounded-xl p-2.5 shadow-sm border border-stone-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-stone-700 mb-0.5" style={{ fontSize: '12px', fontWeight: '600' }}>{t.frameColor.shootingDate}</h3>
                    <p className="text-stone-400" style={{ fontSize: '9px' }}>{t.frameColor.includeDate}</p>
                  </div>
                  <button
                    onClick={() => setIncludeDate(!includeDate)}
                    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                      includeDate ? 'bg-amber-400' : 'bg-stone-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${
                        includeDate ? 'translate-x-4.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Preview + QR/Date + Button */}
        <div className="w-[400px] flex flex-col gap-2 flex-shrink-0 overflow-hidden">
          {/* Preview */}
          <div className="bg-white rounded-xl p-2 shadow-sm border border-stone-200 flex flex-col overflow-hidden flex-1">
            <h2 className="text-center text-stone-700 mb-1 flex-shrink-0" style={{ fontSize: '14px', fontWeight: '600' }}>{t.frameColor.preview}</h2>
            
            {/* Real-time Preview */}
            <div className="relative bg-slate-50 rounded-lg p-1.5 flex items-center justify-center flex-1 overflow-hidden">
              {isGeneratingPreview ? (
                <div className="text-center">
                  <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
                  <p className="text-slate-600" style={{ fontSize: '12px' }}>{t.common.loading}</p>
                </div>
              ) : previewImageUrl ? (
                <div 
                  className="relative mx-auto"
                  style={{
                    aspectRatio: selectedTemplate ? `${selectedTemplate.canvasWidth} / ${selectedTemplate.canvasHeight}` : 'auto',
                    width: '85%',
                  }}
                >
                  <img 
                    src={previewImageUrl} 
                    alt="Preview" 
                    className="w-full h-full rounded-lg shadow-lg block object-contain"
                  />
                  {/* Clickable overlays on preview image */}
                  <div className="absolute inset-0">
                    {selectedTemplate && selectedTemplate.cutPositions.map((pos, idx) => {
                      const photoId = frameSlots[idx];
                      const isEmpty = photoId === null;
                      
                      return (
                        <button
                          key={idx}
                          onClick={(e) => handleFrameSlotClick(e, idx)}
                          className={`absolute transition-all flex items-center justify-center ${
                            photoId 
                              ? 'cursor-pointer hover:ring-2 hover:ring-red-400 hover:ring-inset hover:bg-black/20' 
                              : selectedPhotoId
                              ? 'cursor-pointer border-2 border-dashed border-amber-300 bg-white/80 hover:bg-white hover:border-amber-400'
                              : 'border-2 border-dashed border-gray-300 bg-white/60 pointer-events-none'
                          }`}
                          style={{
                            left: `${(pos.x / selectedTemplate.canvasWidth) * 100}%`,
                            top: `${(pos.y / selectedTemplate.canvasHeight) * 100}%`,
                            width: `${(pos.width / selectedTemplate.canvasWidth) * 100}%`,
                            height: `${(pos.height / selectedTemplate.canvasHeight) * 100}%`,
                          }}
                        >
                          {photoId ? (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <div className="bg-red-500 rounded-full p-3 shadow-xl">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                            </div>
                          ) : isEmpty ? (
                            <div className="flex flex-col items-center justify-center gap-2 px-2">
                              {selectedPhotoId && (
                                <div className="bg-amber-400 rounded-full p-2 shadow-lg">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                  </svg>
                                </div>
                              )}
                              <span className={`text-xs font-medium ${selectedPhotoId ? 'text-amber-600' : 'text-gray-500'}`}>
                                {selectedPhotoId ? t.frameColor.placeHere : t.frameColor.emptyFrame}
                              </span>
                            </div>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : selectedTemplate && (
                <div
                  className="relative mx-auto overflow-hidden"
                  style={{
                    width: selectedTemplate.layout === 'vertical' ? '240px' : '380px',
                    height: selectedTemplate.layout === 'vertical' ? '360px' : '240px',
                    background: selectedOption?.colors.outer,
                  }}
                >
                  {/* Photo slots - clickable to remove */}
                  <div className="w-full h-full relative">
                    {selectedTemplate.cutPositions.map((pos, idx) => {
                      const photoId = frameSlots[idx];
                      const photo = photoId ? capturedPhotos.find(p => p.id === photoId) : null;
                      
                      return (
                        <button
                          key={idx}
                          onClick={(e) => handleFrameSlotClick(e, idx)}
                          className={`absolute flex items-center justify-center transition-all ${
                            photoId 
                              ? 'cursor-pointer hover:ring-2 hover:ring-red-400 hover:ring-inset' 
                              : selectedPhotoId 
                              ? 'bg-white/90 border-2 border-dashed border-amber-300 cursor-pointer hover:bg-white hover:border-amber-400'
                              : 'bg-white/90 border-2 border-dashed border-gray-300'
                          }`}
                          style={{
                            left: `${(pos.x / selectedTemplate.canvasWidth) * 100}%`,
                            top: `${(pos.y / selectedTemplate.canvasHeight) * 100}%`,
                            width: `${(pos.width / selectedTemplate.canvasWidth) * 100}%`,
                            height: `${(pos.height / selectedTemplate.canvasHeight) * 100}%`,
                          }}
                        >
                          {photo ? (
                            <>
                              <img 
                                src={photo.imageData} 
                                alt={`Frame ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {/* X to remove */}
                              <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center group">
                                <div className="opacity-0 group-hover:opacity-100 bg-red-500 rounded-full p-2 shadow-lg transition-opacity">
                                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-2 px-2">
                              {selectedPhotoId && (
                                <div className="bg-amber-400 rounded-full p-2 shadow-lg">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                  </svg>
                                </div>
                              )}
                              <span className={`text-xs font-medium ${selectedPhotoId ? 'text-amber-600' : 'text-gray-400'}`}>
                                {selectedPhotoId ? t.frameColor.clickToPlace : t.frameColor.emptyFrame}
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* QR Code & Date Options - Mobile only */}
          {isMobile && (
            <div className="grid grid-cols-2 gap-2 flex-shrink-0">
              {/* QR Code Option */}
              <div className="bg-white rounded-xl p-2.5 shadow-sm border border-stone-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-stone-700 mb-0.5" style={{ fontSize: '12px', fontWeight: '600' }}>{t.frameColor.qrCode}</h3>
                    <p className="text-stone-400" style={{ fontSize: '9px' }}>{t.frameColor.includeQR}</p>
                  </div>
                  <button
                    onClick={() => setIncludeQR(!includeQR)}
                    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                      includeQR ? 'bg-amber-400' : 'bg-stone-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${
                        includeQR ? 'translate-x-4.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Date Option */}
              <div className="bg-white rounded-xl p-2.5 shadow-sm border border-stone-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-stone-700 mb-0.5" style={{ fontSize: '12px', fontWeight: '600' }}>{t.frameColor.shootingDate}</h3>
                    <p className="text-stone-400" style={{ fontSize: '9px' }}>{t.frameColor.includeDate}</p>
                  </div>
                  <button
                    onClick={() => setIncludeDate(!includeDate)}
                    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                      includeDate ? 'bg-amber-400' : 'bg-stone-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${
                        includeDate ? 'translate-x-4.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={handleSelect}
            size="lg"
            disabled={frameSlots.filter(id => id !== null).length !== requiredPhotoCount}
            className="w-full bg-rose-400 hover:bg-rose-500 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-xl h-11 flex-shrink-0"
            style={{ fontSize: '15px', fontWeight: '600' }}
          >
            {t.frameColor.complete} {frameSlots.filter(id => id !== null).length !== requiredPhotoCount && `(${frameSlots.filter(id => id !== null).length}/${requiredPhotoCount})`}
          </Button>
        </div>
      </div>
    </div>
  );
};
