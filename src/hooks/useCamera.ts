import { useState, useRef, useEffect, useCallback } from 'react';

// Create a mock video stream for demo purposes
const createMockVideoStream = (): MediaStream => {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 900;
  const ctx = canvas.getContext('2d');

  // Helper: draw text pre-mirrored so it reads correctly when CSS scaleX(-1) is applied
  const drawMirroredText = (text: string, x: number, y: number) => {
    if (!ctx) return;
    ctx.save();
    ctx.scale(-1, 1);
    ctx.fillText(text, -x, y);
    ctx.restore();
  };

  let frame = 0;

  const drawFrame = () => {
    if (!ctx) return;
    frame++;

    const w = canvas.width;
    const h = canvas.height;

    // --- Dark neutral background ---
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, w, h);

    // Subtle vignette
    const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.85);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    // --- Camera icon (lens circle) ---
    const cx = w / 2;
    const cy = h / 2 - 60;

    // Outer body
    const bodyW = 200, bodyH = 140, bodyR = 20;
    const bx = cx - bodyW / 2, by = cy - bodyH / 2 - 20;
    ctx.beginPath();
    ctx.moveTo(bx + bodyR, by);
    ctx.lineTo(bx + bodyW - bodyR, by);
    ctx.quadraticCurveTo(bx + bodyW, by, bx + bodyW, by + bodyR);
    ctx.lineTo(bx + bodyW, by + bodyH - bodyR);
    ctx.quadraticCurveTo(bx + bodyW, by + bodyH, bx + bodyW - bodyR, by + bodyH);
    ctx.lineTo(bx + bodyR, by + bodyH);
    ctx.quadraticCurveTo(bx, by + bodyH, bx, by + bodyH - bodyR);
    ctx.lineTo(bx, by + bodyR);
    ctx.quadraticCurveTo(bx, by, bx + bodyR, by);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Lens outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, 44, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Lens inner
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Lens reflection dot
    ctx.beginPath();
    ctx.arc(cx - 9, cy - 9, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fill();

    // Shutter button on body
    ctx.beginPath();
    ctx.arc(cx - bodyW / 2 + 28, by + 10, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fill();

    // --- Pulsing amber dot (live indicator) ---
    const pulse = 0.5 + 0.5 * Math.sin(frame * 0.08);
    ctx.beginPath();
    ctx.arc(cx - bodyW / 2 + 50, by + 10, 5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(251, 191, 36, ${0.5 + pulse * 0.5})`;
    ctx.fill();

    // --- Text (pre-mirrored for scaleX(-1) display) ---
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // "DEMO" badge
    const badgeY = cy + 80;
    ctx.fillStyle = 'rgba(251,191,36,0.15)';
    ctx.beginPath();
    ctx.roundRect(cx - 44, badgeY - 15, 88, 30, 8);
    ctx.fill();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    drawMirroredText('DEMO', cx, badgeY);

    // Subtitle
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '16px system-ui, -apple-system, sans-serif';
    drawMirroredText('카메라 없이 미리보기', cx, cy + 122);

    // Timestamp (bottom)
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '13px monospace';
    drawMirroredText(new Date().toLocaleTimeString('ko-KR'), cx, h - 50);
  };

  const animate = () => {
    drawFrame();
    requestAnimationFrame(animate);
  };
  animate();

  // @ts-ignore
  const stream = canvas.captureStream(30) as MediaStream;
  return stream;
};

export const useCamera = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Keep streamRef in sync with stream state
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  const startCamera = async () => {
    console.log('📹 startCamera called');
    setIsLoading(true);
    setError(null);
    setIsDemoMode(false);

    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('이 브라우저는 카메라를 지원하지 않습니다.');
      }

      // Request camera permission first
      console.log('🎥 Requesting camera access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 600 },
          height: { ideal: 900 },
          facingMode: 'user',
        },
        audio: false,
      });

      console.log('✅ Camera access granted, setting stream:', mediaStream.id);
      setStream(mediaStream);
    } catch (err: any) {
      // Use demo mode for all camera errors (permission denied, not found, etc.)
      console.log('⚠️ Camera error, switching to demo mode:', err.name);
      setIsDemoMode(true);
      const mockStream = createMockVideoStream();
      console.log('🎨 Created mock stream:', mockStream.id);
      setStream(mockStream);
      setError(null); // Clear error since we have a fallback
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = useCallback(() => {
    console.log('🛑 stopCamera called!', new Error().stack);
    const currentStream = streamRef.current;
    if (currentStream) {
      console.log('🛑 Stopping stream tracks...');
      currentStream.getTracks().forEach(track => {
        console.log('  🛑 Stopping track:', track.kind, track.readyState);
        track.stop();
      });
      setStream(null);
      streamRef.current = null;
    } else {
      console.log('⚠️ stopCamera called but no stream to stop');
    }
  }, []);

  const captureFrame = (): string | null => {
    console.log('=== CAPTURE FRAME START ===');
    console.log('📹 videoRef state:', {
      hasVideoRef: !!videoRef,
      hasVideoRefCurrent: !!videoRef.current,
      currentStream: !!streamRef.current,
    });
    
    if (!videoRef.current) {
      console.error('❌ Video ref is not available', {
        videoRef: !!videoRef,
        videoRefCurrent: !!videoRef.current,
      });
      return null;
    }

    const video = videoRef.current;
    
    console.log('📹 Video element state:', {
      readyState: video.readyState,
      readyStateText: ['HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_CURRENT_DATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA'][video.readyState],
      paused: video.paused,
      ended: video.ended,
      muted: video.muted,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      currentTime: video.currentTime,
      duration: video.duration,
      srcObject: !!video.srcObject,
      tracks: video.srcObject ? (video.srcObject as MediaStream).getTracks().length : 0,
      activeTrack: video.srcObject ? (video.srcObject as MediaStream).getVideoTracks()[0]?.readyState : 'none'
    });
    
    // CRITICAL: Check if srcObject is still attached
    if (!video.srcObject) {
      console.error('❌ CRITICAL: Video srcObject is NULL! Stream was disconnected!');
      return null;
    }
    
    const mediaStream = video.srcObject as MediaStream;
    const videoTrack = mediaStream.getVideoTracks()[0];
    
    if (!videoTrack || videoTrack.readyState !== 'live') {
      console.error('❌ Video track is not live:', {
        hasTrack: !!videoTrack,
        trackState: videoTrack?.readyState
      });
      return null;
    }
    
    // Check if video is ready and has valid dimensions
    if (video.readyState < 2) {
      console.error('❌ Video is not ready yet, readyState:', video.readyState);
      return null;
    }
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('❌ Video has invalid dimensions:', video.videoWidth, video.videoHeight);
      return null;
    }
    
    // Check if video is actually playing
    if (video.paused || video.ended) {
      console.error('❌ Video is not playing, paused:', video.paused, 'ended:', video.ended);
      // Try to play it
      console.log('🔄 Attempting to resume video...');
      video.play().then(() => {
        console.log('✅ Video resumed successfully');
      }).catch(err => {
        console.error('❌ Failed to resume video:', err);
      });
      return null;
    }
    
    // Note: For live camera streams (MediaStream), currentTime is typically 0
    // This is normal behavior and doesn't indicate a problem

    console.log('✅ Video validation passed, creating canvas...');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('❌ Could not get canvas context');
      return null;
    }

    console.log('🎨 Drawing video frame to canvas with horizontal flip...');
    
    // Fill with a test color first to verify canvas is working
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 10, 10);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save context state
    ctx.save();
    
    // Flip horizontally for mirror effect (selfie mode)
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
    
    // Draw the video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Restore context state
    ctx.restore();
    
    console.log('📊 Checking captured image data...');
    
    // Check if we actually drew something (not all black)
    const imageData = ctx.getImageData(0, 0, Math.min(100, canvas.width), Math.min(100, canvas.height));
    const data = imageData.data;
    let hasColor = false;
    let totalBrightness = 0;
    let samplePixels = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = r + g + b;
      totalBrightness += brightness;
      samplePixels++;
      
      // Check if any pixel is not black (R, G, B all > 10)
      if (r > 10 || g > 10 || b > 10) {
        hasColor = true;
      }
    }
    
    const avgBrightness = totalBrightness / samplePixels;
    
    console.log('📈 Image analysis:', {
      hasColor,
      avgBrightness: avgBrightness.toFixed(2),
      samplePixels,
      canvasSize: `${canvas.width}x${canvas.height}`
    });
    
    if (!hasColor) {
      console.warn('⚠️ Captured frame appears to be all black!');
      console.log('🔍 Sampling first 20 pixels RGB values:');
      for (let i = 0; i < Math.min(20, data.length / 4); i++) {
        const idx = i * 4;
        console.log(`  Pixel ${i}: R=${data[idx]} G=${data[idx+1]} B=${data[idx+2]}`);
      }
    } else {
      console.log('✅ Frame has color content');
    }
    
    const dataUrl = canvas.toDataURL('image/png');
    console.log('📸 Data URL created, length:', dataUrl.length);
    console.log('=== CAPTURE FRAME END ===');
    
    return dataUrl;
  };

  // Log stream changes
  useEffect(() => {
    console.log('🔄 Stream state changed:', stream ? `Active (${stream.id})` : 'null');
    if (stream) {
      const tracks = stream.getVideoTracks();
      console.log('  📹 Video tracks:', tracks.length, tracks[0]?.readyState);
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      console.log('🧹 useCamera unmounting, stopping camera');
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    stream,
    error,
    isLoading,
    isDemoMode,
    startCamera,
    stopCamera,
    captureFrame,
  };
};
