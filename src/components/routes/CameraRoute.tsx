import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CameraPreview } from '../CameraPreview';
import { usePhotoBoothContext } from '../../contexts/PhotoBoothContext';
import { toast } from 'sonner@2.0.3';
import { useTranslation } from '../../hooks/useTranslation';
import { CapturedPhoto } from '../../types/photobooth';

export const CameraRoute = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    selectedMode,
    selectedTemplate,
    selectedTheme,
    videoRef,
    stream,
    isDemoMode,
    startCamera,
    captureFrame,
    capturedPhotos,
    setCapturedPhotos,
    currentCut,
    setCurrentCut,
    isCapturing,
    setIsCapturing,
    countdown,
    setCountdown,
    stopCamera,
    resetAll,
  } = usePhotoBoothContext();

  // Get the overlay for current cut (ONLY for special mode!)
  const currentOverlayUrl = selectedMode === 'special' && selectedTheme?.overlays && selectedTheme.overlays.length > currentCut 
    ? selectedTheme.overlays[currentCut] 
    : undefined;

  // Redirect if no template selected
  useEffect(() => {
    if (!selectedTemplate) {
      navigate('/');
    }
  }, [selectedTemplate, navigate]);

  // Ensure camera is started when component mounts
  useEffect(() => {
    const initCamera = async () => {
      if (!stream && selectedTemplate) {
        console.log('🎥 CameraRoute: Starting camera...');
        try {
          await startCamera();
        } catch (err) {
          console.error('❌ Failed to start camera:', err);
          toast.error('카메라를 시작할 수 없습니다.');
        }
      }
    };
    
    initCamera();
    // Only run when stream changes from null to something, or on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!selectedTemplate) return null;

  const handleCapture = async () => {
    // Prevent capturing more photos than needed
    // Basic mode: 8 shots, Special mode: template cuts
    const maxPhotos = selectedMode === 'basic' ? 8 : selectedTemplate.cuts;
    if (capturedPhotos.length >= maxPhotos) {
      console.log('⚠️ Already captured all photos, ignoring click');
      return;
    }
    
    if (isCapturing) {
      console.log('⚠️ Already capturing, ignoring click');
      return;
    }
    
    console.log('🎯 handleCapture called', {
      hasVideoRef: !!videoRef,
      hasVideoRefCurrent: !!videoRef.current,
      hasStream: !!stream,
    });
    
    if (!videoRef.current || !stream) {
      console.error('❌ Camera not ready:', { 
        hasVideoRef: !!videoRef,
        hasVideoRefCurrent: !!videoRef.current, 
        hasStream: !!stream 
      });
      toast.error(t.camera.cameraNotReady || '카메라가 준비되지 않았습니다.');
      return;
    }
    
    setIsCapturing(true);
    
    // Capture immediately without countdown
    const video = videoRef.current;
    
    // Check video availability
    if (!video) {
      console.error('❌ Video element not available');
      toast.error(t.camera.cameraNotReady || '카메라가 준비되지 않았습니다.');
      setIsCapturing(false);
      return;
    }
    
    if (video.readyState < 2) {
      await new Promise<void>((resolve) => {
        const checkReady = () => {
          if (video.readyState >= 2) {
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });
    }
    
    if (video.paused) {
      try {
        await video.play();
      } catch (err) {
        console.error('Failed to play video:', err);
      }
    }
    
    // Small delay to ensure frame is ready
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            resolve(undefined);
          }, 50);
        });
      });
    });
    
    const imageData = captureFrame();
    
    if (!imageData) {
      toast.error(t.camera.captureFailed || '사진 촬영에 실패했습니다.');
      setIsCapturing(false);
      return;
    }
    
    const newPhoto: CapturedPhoto = {
      id: `photo-${Date.now()}-${Math.random()}`,
      imageData,
      timestamp: Date.now(),
    };
    
    const updatedPhotos = [...capturedPhotos, newPhoto];
    setCapturedPhotos(updatedPhotos);
    
    // Basic mode: 8 shots, Special mode: template cuts
    const totalCuts = selectedMode === 'basic' ? 8 : selectedTemplate.cuts;
    const nextCut = currentCut + 1;
    
    if (nextCut >= totalCuts) {
      setIsCapturing(false);
      
      setTimeout(() => {
        stopCamera();
        // Special mode: skip photo selection, go straight to result
        // Basic mode: go to photo selection
        navigate(selectedMode === 'special' ? '/result' : '/select');
      }, 500);
    } else {
      setCurrentCut(nextCut);
      setIsCapturing(false);
    }
  };

  const handleCancel = () => {
    resetAll();
    navigate('/');
  };

  return (
    <CameraPreview
      videoRef={videoRef}
      stream={stream}
      isDemoMode={isDemoMode}
      onCapture={handleCapture}
      currentCut={currentCut}
      totalCuts={selectedMode === 'basic' ? 8 : selectedTemplate.cuts}
      photoWidth={selectedTemplate.cutPositions[0].width}
      photoHeight={selectedTemplate.cutPositions[0].height}
      isCapturing={isCapturing}
      countdown={countdown}
      onCancel={handleCancel}
      overlayUrl={currentOverlayUrl}
    />
  );
};
