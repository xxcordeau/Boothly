import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResultPreview } from '../ResultPreview';
import { usePhotoBoothContext } from '../../contexts/PhotoBoothContext';
import { usePhotoComposer } from '../../hooks/usePhotoComposer';
import { toast } from 'sonner@2.0.3';
import { applyOverlayToPhoto } from '../../utils/applyOverlayToPhoto';
import QRCode from 'qrcode';
import { getShareableUrl } from '../../utils/imageStorage';

export const ResultRoute = () => {
  const navigate = useNavigate();
  const { 
    selectedMode,
    finalImageUrl, 
    selectedTemplate, 
    selectedPrintOption, 
    capturedPhotos,
    selectedTheme,
    setFinalImageUrl,
    resetAll 
  } = usePhotoBoothContext();
  const { composePhotos } = usePhotoComposer();
  
  const [isComposing, setIsComposing] = useState(false);
  const [includeQR, setIncludeQR] = useState(false);
  const [includeDate, setIncludeDate] = useState(false);
  const [optionsShown, setOptionsShown] = useState(false);
  const [initialCompositionDone, setInitialCompositionDone] = useState(false);

  // For special mode, compose initial preview on mount
  useEffect(() => {
    const composeSpecialMode = async () => {
      // Only compose if:
      // 1. We're in special mode
      // 2. We don't have a final image yet
      // 3. We have captured photos
      // 4. We have a template
      // 5. Initial composition not done yet
      if (selectedMode === 'special' && !initialCompositionDone && capturedPhotos.length > 0 && selectedTemplate) {
        setIsComposing(true);
        try {
          console.log('🎨 Special mode: Auto-composing photos with overlays...');
          
          // Apply overlays to captured photos
          const photosWithOverlays = await Promise.all(
            capturedPhotos.map(async (photo, index) => {
              const overlayUrl = selectedTheme?.overlays?.[index];
              if (overlayUrl) {
                console.log(`✨ Applying overlay ${index + 1} to photo ${index + 1}`);
                const overlaidPhoto = await applyOverlayToPhoto(
                  photo.imageData,
                  overlayUrl,
                  selectedTemplate.cutPositions[0].width,
                  selectedTemplate.cutPositions[0].height
                );
                return { ...photo, imageData: overlaidPhoto };
              }
              return photo;
            })
          );

          // Use theme frame if available
          let template = { ...selectedTemplate };
          if (selectedTheme?.frame) {
            template.compositeFrameUrl = selectedTheme.frame.imageUrl || selectedTheme.frame.dataUrl;
            console.log('🖼️ Using theme frame:', template.compositeFrameUrl?.substring(0, 50));
          } else {
            // No frame for special mode - just use overlays
            console.log('🖼️ No frame selected, composing with overlays only');
            template.compositeFrameUrl = undefined;
          }

          // Compose photos (without QR/Date for initial preview)
          console.log('📦 Composing photos...');
          const composedUrl = await composePhotos(
            photosWithOverlays, 
            template, 
            'normal',
            undefined,
            undefined,
            false,
            'special'
          );

          setFinalImageUrl(composedUrl);
          setInitialCompositionDone(true);
          console.log('✅ Special mode composition complete');
        } catch (err) {
          console.error('❌ Failed to compose special mode photos:', err);
          toast.error('사진 합성에 실패했습니다.');
          navigate('/');
        } finally {
          setIsComposing(false);
        }
      }
    };

    composeSpecialMode();
  }, [selectedMode, capturedPhotos.length, selectedTemplate?.id, initialCompositionDone]);

  // Redirect if no data
  useEffect(() => {
    if (selectedMode === 'basic' && !finalImageUrl) {
      navigate('/');
    } else if (selectedMode === 'special' && capturedPhotos.length === 0) {
      navigate('/');
    }
  }, [selectedMode, finalImageUrl, capturedPhotos.length, navigate]);

  // Handle QR/Date options for special mode
  const handleOptionsConfirm = async () => {
    if (!selectedTemplate || capturedPhotos.length === 0) return;

    setIsComposing(true);
    try {
      console.log('🎨 Re-composing with QR/Date options...', { includeQR, includeDate });
      
      // Apply overlays to captured photos
      const photosWithOverlays = await Promise.all(
        capturedPhotos.map(async (photo, index) => {
          const overlayUrl = selectedTheme?.overlays?.[index];
          if (overlayUrl) {
            const overlaidPhoto = await applyOverlayToPhoto(
              photo.imageData,
              overlayUrl,
              selectedTemplate.cutPositions[0].width,
              selectedTemplate.cutPositions[0].height
            );
            return { ...photo, imageData: overlaidPhoto };
          }
          return photo;
        })
      );

      // Use theme frame if available
      let template = { ...selectedTemplate };
      if (selectedTheme?.frame) {
        template.compositeFrameUrl = selectedTheme.frame.imageUrl || selectedTheme.frame.dataUrl;
        console.log('🖼️ Using theme frame for re-composition');
      } else {
        // No frame for special mode - just use overlays
        console.log('🖼️ No frame selected, re-composing with overlays only');
        template.compositeFrameUrl = undefined;
      }

      // Generate QR code if needed
      let qrCodeDataUrl: string | undefined = undefined;
      if (includeQR) {
        try {
          const imageId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
          const shareableUrl = getShareableUrl(imageId);
          qrCodeDataUrl = await QRCode.toDataURL(shareableUrl, {
            width: 200,
            margin: 1,
            errorCorrectionLevel: 'M',
            type: 'image/png',
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          });
          (window as any).__photoboothImageId = imageId;
        } catch (qrError) {
          console.error('❌ Failed to generate QR code:', qrError);
        }
      }

      // Compose photos
      const composedUrl = await composePhotos(
        photosWithOverlays, 
        template, 
        'normal',
        undefined,
        qrCodeDataUrl,
        includeDate,
        'special'
      );

      setFinalImageUrl(composedUrl);
      toast.success('사진이 완성되었습니다!');
    } catch (err) {
      console.error('❌ Failed to re-compose photos:', err);
      toast.error('사진 합성에 실패했습니다.');
    } finally {
      setIsComposing(false);
    }
  };

  const handleRestart = () => {
    resetAll();
    navigate('/');
  };

  // Show loading while composing
  if (isComposing) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">사진을 합성하는 중...</p>
        </div>
      </div>
    );
  }

  // Show options dialog for special mode before showing final result
  if (selectedMode === 'special' && finalImageUrl && !optionsShown) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50 p-4 overflow-hidden">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-4 flex flex-col" style={{ maxHeight: 'calc(100vh - 32px)' }}>
          <h2 className="text-lg font-bold text-slate-800 mb-3 text-center flex-shrink-0">추가 옵션 선택</h2>
          
          {/* Preview with overlays */}
          <div className="mb-3 border-2 border-slate-200 rounded-lg overflow-hidden flex-1 flex items-center justify-center bg-slate-50" style={{ minHeight: 0 }}>
            <img src={finalImageUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
          </div>

          <div className="space-y-2 mb-3 flex-shrink-0">
            <label className="flex items-center gap-2 p-2.5 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-indigo-400 transition-colors">
              <input
                type="checkbox"
                checked={includeQR}
                onChange={(e) => setIncludeQR(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded flex-shrink-0"
              />
              <div>
                <div className="font-semibold text-slate-800 text-sm">QR 코드 추가</div>
                <div className="text-xs text-slate-500">사진을 모바일로 다운로드할 수 있는 QR 코드</div>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2.5 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-indigo-400 transition-colors">
              <input
                type="checkbox"
                checked={includeDate}
                onChange={(e) => setIncludeDate(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded flex-shrink-0"
              />
              <div>
                <div className="font-semibold text-slate-800 text-sm">날짜 추가</div>
                <div className="text-xs text-slate-500">오늘 날짜를 사진에 표시</div>
              </div>
            </label>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleRestart}
              className="flex-1 px-4 py-2.5 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors text-sm"
            >
              취소
            </button>
            <button
              onClick={async () => {
                if (includeQR || includeDate) {
                  await handleOptionsConfirm();
                }
                setOptionsShown(true);
              }}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition-colors text-sm"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show final result
  if (!finalImageUrl) return null;

  return (
    <ResultPreview
      imageUrl={finalImageUrl}
      templateName={selectedTemplate?.name || 'photo'}
      printOption={selectedPrintOption}
      onReset={handleRestart}
    />
  );
};
