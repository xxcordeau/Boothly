import { useEffect, useState, useRef } from 'react';
import { Button } from './ui/button';
import { Camera, X } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useIsMobile } from './ui/use-mobile';

interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  isDemoMode?: boolean;
  onCapture: () => void;
  onCancel: () => void;
  isCapturing: boolean;
  currentCut: number;
  totalCuts: number;
  countdown: number | null;
  photoWidth: number;
  photoHeight: number;
  autoTimer?: number;
  overlayUrl?: string;
}

export const CameraPreview = ({
  videoRef,
  stream,
  isDemoMode = false,
  onCapture,
  onCancel,
  isCapturing,
  currentCut,
  totalCuts,
  countdown,
  photoWidth,
  photoHeight,
  autoTimer = 10,
  overlayUrl,
}: CameraPreviewProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const aspectRatio = `${photoWidth}/${photoHeight}`;
  const [autoCountdown, setAutoCountdown] = useState<number>(autoTimer);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const autoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldTriggerCapture = useRef<boolean>(false);
  const prevCutRef = useRef(currentCut);

  // Flash effect when a photo is taken
  useEffect(() => {
    if (currentCut > prevCutRef.current) {
      setShowFlash(true);
      const timer = setTimeout(() => setShowFlash(false), 350);
      prevCutRef.current = currentCut;
      return () => clearTimeout(timer);
    }
    prevCutRef.current = currentCut;
  }, [currentCut]);

  // Auto-capture timer
  useEffect(() => {
    if (isCapturing || countdown !== null || !isVideoReady) {
      if (autoTimerRef.current) {
        clearInterval(autoTimerRef.current);
      }
      setAutoCountdown(autoTimer);
      shouldTriggerCapture.current = false;
      return;
    }

    autoTimerRef.current = setInterval(() => {
      setAutoCountdown((prev) => {
        if (prev <= 1) {
          shouldTriggerCapture.current = true;
          return autoTimer;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (autoTimerRef.current) {
        clearInterval(autoTimerRef.current);
      }
    };
  }, [isCapturing, countdown, autoTimer, isVideoReady]);

  // Trigger auto-capture when flag is set
  useEffect(() => {
    if (shouldTriggerCapture.current && !isCapturing && countdown === null && isVideoReady) {
      shouldTriggerCapture.current = false;
      onCapture();
    }
  }, [autoCountdown, isCapturing, countdown, onCapture, isVideoReady]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) {
      setIsVideoReady(false);
      return;
    }

    if (video.srcObject !== stream) {
      video.srcObject = stream;
      setIsVideoReady(false);
    }

    const tryPlay = () => {
      if (!video.srcObject) return;
      video.play().then(() => {
        setIsVideoReady(true);
      }).catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Video play error:', err);
        }
      });
    };

    const handlePause = () => {
      if (video && video.srcObject) {
        video.play().catch((err) => {
          if (err.name !== 'AbortError') {
            console.error('Video resume error:', err);
          }
        });
      }
    };

    video.addEventListener('loadedmetadata', tryPlay);
    video.addEventListener('canplay', tryPlay);
    video.addEventListener('pause', handlePause);

    // Handle already-loaded stream (canvas demo stream or re-render)
    if (video.readyState >= 1) {
      tryPlay();
    } else {
      // Fallback: force play after short delay regardless of events
      setTimeout(() => {
        if (video.srcObject && !isVideoReady) tryPlay();
      }, 300);
    }

    const keepAliveInterval = setInterval(() => {
      if (video && video.srcObject && video.paused) {
        video.play().then(() => setIsVideoReady(true)).catch(() => {});
      }
    }, 500);

    return () => {
      clearInterval(keepAliveInterval);
      video.removeEventListener('loadedmetadata', tryPlay);
      video.removeEventListener('canplay', tryPlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [stream]);

  // Loading state
  if (!stream) {
    return (
      <div className={`${isMobile ? 'h-[calc(100dvh-56px)]' : 'h-[calc(100vh-56px)]'} flex flex-col items-center justify-center bg-black overflow-hidden`}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/70 text-sm">카메라를 준비하는 중...</p>
        </div>
      </div>
    );
  }

  // Shared video content
  const videoContent = (
    <>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ backgroundColor: '#000', position: 'relative', zIndex: 1, transform: 'scaleX(-1)' }}
        onPause={(e) => { const v = e.currentTarget; if (v.srcObject) v.play().catch(() => {}); }}
      />
      {overlayUrl && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
          <img src={overlayUrl} alt="Overlay" className="w-full h-full object-cover" />
        </div>
      )}
      {countdown !== null && countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80" style={{ pointerEvents: 'none', zIndex: 3 }}>
          <div className="text-rose-400 font-bold animate-pulse" style={{ fontSize: isMobile ? '6rem' : '8rem' }}>{countdown}</div>
        </div>
      )}
      {/* Progress pill — dots + counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2.5" style={{ zIndex: 10 }}>
        <div className="flex gap-1.5 items-center">
          {Array.from({ length: totalCuts }).map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i < currentCut ? 'w-2.5 h-2.5 bg-white' : 'w-2 h-2 bg-white/30'
              }`}
            />
          ))}
        </div>
        <span className="text-white/70 text-xs font-semibold">{currentCut}/{totalCuts}</span>
      </div>
      {/* Camera flash overlay */}
      {showFlash && (
        <div className="absolute inset-0 bg-white animate-flash pointer-events-none" style={{ zIndex: 20 }} />
      )}
      {/* Auto-timer */}
      {!isCapturing && countdown === null && isVideoReady && (
        <div className={`absolute left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full transition-all ${autoCountdown <= 3 ? 'bg-red-500 animate-pulse' : 'bg-black/60 backdrop-blur-sm'}`}
          style={{ zIndex: 10, top: isMobile ? '3.5rem' : '3.5rem' }}>
          <p className="text-white text-xs font-semibold">
            {autoCountdown}{t.frameColor.seconds} {t.camera.autoCapture}
          </p>
        </div>
      )}
      {!isVideoReady && (
        <div className="absolute left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm" style={{ zIndex: 10, top: '3.5rem' }}>
          <p className="text-white text-xs">{t.camera.preparing}</p>
        </div>
      )}
      {isDemoMode && (
        <div className="absolute bottom-4 left-4 bg-amber-400 px-2.5 py-1 rounded-lg" style={{ zIndex: 10 }}>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <p className="text-white text-xs font-semibold">DEMO</p>
          </div>
        </div>
      )}
      <button onClick={onCancel} className="absolute top-4 right-4 w-9 h-9 bg-black/60 backdrop-blur-sm hover:bg-black/80 flex items-center justify-center rounded-full transition-colors" style={{ zIndex: 10 }}>
        <X className="w-4 h-4 text-white" />
      </button>
    </>
  );

  // Mobile layout: full-screen immersive
  if (isMobile) {
    return (
      <div className="h-[calc(100dvh-56px)] flex flex-col bg-black overflow-hidden">
        {/* Video fills top space */}
        <div className="flex-1 relative overflow-hidden">
          {videoContent}
        </div>
        {/* Bottom action bar */}
        <div className="flex-shrink-0 bg-black px-6 py-5 flex flex-col items-center gap-2">
          <button
            onClick={onCapture}
            disabled={isCapturing || !isVideoReady}
            className="w-20 h-20 rounded-full bg-white disabled:opacity-40 active:scale-95 transition-transform flex items-center justify-center shadow-lg"
          >
            <div className="w-16 h-16 rounded-full bg-rose-400 flex items-center justify-center">
              <Camera className="w-7 h-7 text-white" />
            </div>
          </button>
          <p className="text-white/50 text-xs">
            {!isVideoReady ? t.camera.preparing : isCapturing ? t.camera.takingPhoto : t.camera.instruction}
          </p>
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="h-[calc(100vh-56px)] flex flex-col items-center justify-center bg-[#F3F3F3] p-3 overflow-hidden">
      <div className="w-full max-w-3xl h-full flex flex-col justify-center">
        <div className="relative bg-black rounded-2xl overflow-hidden" style={{ aspectRatio, maxHeight: 'calc(100vh - 160px)' }}>
          {videoContent}
        </div>
        <div className="mt-3 flex justify-center">
          <Button
            onClick={onCapture}
            disabled={isCapturing || !isVideoReady}
            size="lg"
            className="bg-rose-400 hover:bg-rose-500 px-12 py-5 rounded-2xl text-white gap-2 disabled:opacity-50 font-semibold text-lg shadow-sm transition-colors"
          >
            <Camera className="w-5 h-5" />
            {!isVideoReady ? t.camera.preparing : isCapturing ? t.camera.takingPhoto : t.camera.takePhoto}
          </Button>
        </div>
        <div className="mt-2 text-center text-stone-500 text-sm">
          <p>{isVideoReady ? t.camera.instruction : t.camera.preparing}</p>
        </div>
      </div>

      <style>{`
        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};
