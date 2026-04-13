// Utility to create a transparent frame from an image
// This creates a frame with the person on the left side and transparent area on the right for photos

export const createTransparentFrameCanvas = async (
  sourceImageUrl: string,
  canvasWidth: number,
  canvasHeight: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Clear canvas (transparent)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw decorative border
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 8;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      // Draw inner border
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 4;
      ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

      // Draw the person image on the left side (scaled down)
      const personWidth = 200;
      const personHeight = (img.height / img.width) * personWidth;
      const personX = 30;
      const personY = canvas.height - personHeight - 30;
      
      ctx.drawImage(img, personX, personY, personWidth, personHeight);

      // Add some decorative elements
      // Top decoration
      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 32px Pretendard, sans-serif';
      ctx.fillText('📸 Photo Booth', canvas.width / 2 - 120, 60);

      // Bottom decoration
      ctx.fillStyle = '#ec4899';
      ctx.font = '20px Pretendard, sans-serif';
      const date = new Date().toLocaleDateString('ko-KR');
      ctx.fillText(date, canvas.width / 2 - 60, canvas.height - 30);

      // Convert to data URL
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      reject(new Error('Failed to load source image'));
    };

    img.src = sourceImageUrl;
  });
};
