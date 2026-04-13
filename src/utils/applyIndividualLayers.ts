// Apply individual layers (background + photo + overlay) to create a framed photo
export const applyIndividualLayers = async (
  photoDataUrl: string,
  backgroundDataUrl?: string,
  overlayDataUrl?: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    // Standard individual photo size - 4x6 inch (2:3 ratio)
    canvas.width = 600;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    const loadAndDrawLayers = async () => {
      try {
        // Layer 1: Background (if provided)
        if (backgroundDataUrl) {
          await new Promise<void>((res, rej) => {
            const bgImg = new Image();
            bgImg.onload = () => {
              ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
              res();
            };
            bgImg.onerror = () => rej(new Error('Failed to load background layer'));
            bgImg.src = backgroundDataUrl;
          });
        }

        // Layer 2: Photo (center layer)
        await new Promise<void>((res, rej) => {
          const photoImg = new Image();
          photoImg.onload = () => {
            ctx.drawImage(photoImg, 0, 0, canvas.width, canvas.height);
            res();
          };
          photoImg.onerror = () => rej(new Error('Failed to load photo'));
          photoImg.src = photoDataUrl;
        });

        // Layer 3: Overlay (if provided)
        if (overlayDataUrl) {
          await new Promise<void>((res, rej) => {
            const overlayImg = new Image();
            overlayImg.onload = () => {
              // Flip overlay horizontally to match the flipped photo
              ctx.save();
              ctx.scale(-1, 1);
              ctx.translate(-canvas.width, 0);
              ctx.drawImage(overlayImg, 0, 0, canvas.width, canvas.height);
              ctx.restore();
              res();
            };
            overlayImg.onerror = () => rej(new Error('Failed to load overlay layer'));
            overlayImg.src = overlayDataUrl;
          });
        }

        // Convert to data URL
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error('Error applying individual layers:', err);
        // If layers fail, return original photo
        resolve(photoDataUrl);
      }
    };

    loadAndDrawLayers();
  });
};
