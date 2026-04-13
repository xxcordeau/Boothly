import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FrameColorSelector, FrameColorOption } from '../FrameColorSelector';
import { usePhotoBoothContext } from '../../contexts/PhotoBoothContext';
import { usePhotoComposer } from '../../hooks/usePhotoComposer';
import { toast } from 'sonner@2.0.3';
import { useTranslation } from '../../hooks/useTranslation';
import { FilterType, CapturedPhoto } from '../../types/photobooth';
import { generateCustomFrame } from '../../utils/generateCustomFrame';
import QRCode from 'qrcode';
import { getShareableUrl } from '../../utils/imageStorage';

export const SelectRoute = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    selectedMode,
    selectedTemplate,
    capturedPhotos,
    setSelectedFrameColor,
    setSelectedFilter,
    setFinalImageUrl,
    setSelectedTemplate,
    resetAll,
  } = usePhotoBoothContext();
  const { composePhotos } = usePhotoComposer();

  // Redirect if no captured photos
  useEffect(() => {
    if (!selectedTemplate || capturedPhotos.length === 0) {
      navigate('/');
    }
  }, [selectedTemplate, capturedPhotos, navigate]);

  if (!selectedTemplate || capturedPhotos.length === 0) return null;

  const handleConfirm = async (
    frameColor: FrameColorOption, 
    filter: FilterType, 
    selectedPhotos?: (CapturedPhoto | null)[], 
    includeQR?: boolean, 
    includeDate?: boolean
  ) => {
    console.log('🎯 handleConfirm called with:', {
      frameColor: frameColor.id,
      filter,
      photosCount: selectedPhotos?.length,
      includeQR,
      includeDate
    });
    
    setSelectedFrameColor(frameColor);
    setSelectedFilter(filter);
    
    const photosToCompose = selectedPhotos || capturedPhotos;
    console.log('📸 Photos to compose:', photosToCompose.length);
    
    let template = { ...selectedTemplate };
    
    // Generate frame for basic mode
    if (selectedMode === 'basic') {
      try {
        console.log('🖼️ Generating composite frame for basic mode...');
        const compositeFrameUrl = await generateCustomFrame(
          template.canvasWidth,
          template.canvasHeight,
          frameColor
        );
        template = { ...template, compositeFrameUrl };
        console.log('✅ Composite frame generated');
      } catch (err) {
        console.error('❌ Failed to generate composite frame:', err);
      }
    }
    
    setSelectedTemplate(template);
    
    try {
      console.log('🎨 Starting photo composition...');
      toast.loading(t.camera.composing || '사진을 합성하는 중...');
      
      let qrCodeDataUrl: string | undefined = undefined;
      
      // Generate QR code first if needed
      if (includeQR) {
        try {
          console.log('🔲 Generating QR code before composition...');
          
          // Generate unique image ID
          const imageId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
          console.log('🆔 Generated image ID:', imageId);
          
          // Generate shareable URL
          const shareableUrl = getShareableUrl(imageId);
          console.log('🔗 Shareable URL:', shareableUrl);
          console.log('📏 URL length:', shareableUrl.length);
          
          // Validate URL before generating QR code
          if (!shareableUrl || shareableUrl.length === 0) {
            throw new Error('Invalid shareable URL');
          }
          
          console.log('📦 Generating QR code...');
          
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
          
          if (!qrCodeDataUrl || !qrCodeDataUrl.startsWith('data:image/')) {
            throw new Error('Invalid QR code data URL generated');
          }
          
          console.log('✅ QR code generated successfully');
          console.log('📏 QR code data URL length:', qrCodeDataUrl.length);
          console.log('🔤 QR code prefix:', qrCodeDataUrl.substring(0, 30));
          
          // Store imageId in context for later use in ResultRoute
          (window as any).__photoboothImageId = imageId;
        } catch (qrError) {
          console.error('❌ Failed to generate QR code:', qrError);
          console.error('Error stack:', qrError instanceof Error ? qrError.stack : 'No stack');
          // Continue without QR code - reset to null
          qrCodeDataUrl = null;
        }
      }
      
      console.log('📦 Calling composePhotos from usePhotoComposer hook');
      const composedUrl = await composePhotos(photosToCompose, template, filter, undefined, qrCodeDataUrl, includeDate, selectedMode || 'basic');
      
      console.log('✅ Photo composition complete');
      console.log('📏 Composed URL length:', composedUrl.length);
      console.log('🔤 Composed URL type:', composedUrl.startsWith('data:') ? 'data URL' : composedUrl.startsWith('blob:') ? 'blob URL' : 'unknown');
      console.log('📝 Composed URL prefix:', composedUrl.substring(0, 50));
      
      setFinalImageUrl(composedUrl);
      toast.dismiss();
      toast.success(t.camera.complete || '사진이 완성되었습니다!');
      
      console.log('🔄 Navigating to result page...');
      navigate('/result');
    } catch (err) {
      console.error('❌ Compose error:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      toast.dismiss();
      toast.error(t.camera.composeFailed || '사진 합성에 실패했습니다.');
    }
  };

  const handleCancel = () => {
    resetAll();
    navigate('/');
  };

  return (
    <FrameColorSelector
      capturedPhotos={capturedPhotos}
      selectedTemplate={selectedTemplate}
      mode={selectedMode || 'basic'}
      onSelect={handleConfirm}
      onBack={handleCancel}
    />
  );
};
