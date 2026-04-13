import type { FrameColorOption } from '../components/FrameColorSelector';

/**
 * Generate a composite frame (final result frame) with selected color
 * This frame wraps the entire photo strip with all cuts
 */
export async function generateCustomFrame(
  width: number,
  height: number,
  frameColor: FrameColorOption
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Fill entire canvas with selected color
      if (frameColor.gradient) {
        // Draw gradient background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, frameColor.gradient.start);
        gradient.addColorStop(0.5, frameColor.gradient.middle);
        gradient.addColorStop(1, frameColor.gradient.end);
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = frameColor.colors.outer;
      }
      ctx.fillRect(0, 0, width, height);

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl);
    } catch (error) {
      reject(error);
    }
  });
}
