// Apply overlay to a photo
export const applyOverlayToPhoto = async (
  photoDataUrl: string,
  overlayUrl: string | undefined,
  width: number,
  height: number
): Promise<string> => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Load and draw the photo
  const photoImg = await loadImage(photoDataUrl);
  ctx.drawImage(photoImg, 0, 0, width, height);

  // Load and draw the overlay if it exists
  if (overlayUrl) {
    try {
      const overlayImg = await loadImage(overlayUrl);
      ctx.drawImage(overlayImg, 0, 0, width, height);
    } catch (err) {
      console.warn('Failed to load overlay:', err);
    }
  }

  return canvas.toDataURL('image/png');
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};
