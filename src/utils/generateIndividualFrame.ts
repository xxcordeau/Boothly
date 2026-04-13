import type { FrameColorOption } from '../components/FrameColorSelector';

export const generateIndividualFrame = async (
  width: number,
  height: number,
  frameColor?: FrameColorOption
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    // Clear canvas (transparent background)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create gradient or solid color for outer border
    let outerBorderStyle: string | CanvasGradient;
    if (frameColor?.gradient) {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, frameColor.gradient.start);
      gradient.addColorStop(0.5, frameColor.gradient.middle);
      gradient.addColorStop(1, frameColor.gradient.end);
      outerBorderStyle = gradient;
    } else {
      outerBorderStyle = frameColor?.colors.outer || '#a855f7';
    }
    
    // Draw decorative borders
    // Outer border
    ctx.strokeStyle = outerBorderStyle;
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

    // Inner border
    ctx.strokeStyle = frameColor?.colors.inner || '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);

    // Add decorative corners
    const cornerSize = 25;
    ctx.strokeStyle = frameColor?.colors.accent || '#fbbf24';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    // Top left corner
    ctx.beginPath();
    ctx.moveTo(25, 25 + cornerSize);
    ctx.lineTo(25, 25);
    ctx.lineTo(25 + cornerSize, 25);
    ctx.stroke();

    // Top right corner
    ctx.beginPath();
    ctx.moveTo(canvas.width - 25 - cornerSize, 25);
    ctx.lineTo(canvas.width - 25, 25);
    ctx.lineTo(canvas.width - 25, 25 + cornerSize);
    ctx.stroke();

    // Bottom left corner
    ctx.beginPath();
    ctx.moveTo(25, canvas.height - 25 - cornerSize);
    ctx.lineTo(25, canvas.height - 25);
    ctx.lineTo(25 + cornerSize, canvas.height - 25);
    ctx.stroke();

    // Bottom right corner
    ctx.beginPath();
    ctx.moveTo(canvas.width - 25 - cornerSize, canvas.height - 25);
    ctx.lineTo(canvas.width - 25, canvas.height - 25);
    ctx.lineTo(canvas.width - 25, canvas.height - 25 - cornerSize);
    ctx.stroke();

    // Convert to data URL
    const frameDataUrl = canvas.toDataURL('image/png');
    resolve(frameDataUrl);
  });
};
