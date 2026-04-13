// Apply individual frame overlay to a captured photo
export const applyIndividualFrame = async (
  photoDataUrl: string,
  frameDataUrl: string
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

    // Load photo
    const photoImg = new Image();
    photoImg.onload = () => {
      // Draw the photo (already flipped from capture)
      ctx.drawImage(photoImg, 0, 0, canvas.width, canvas.height);

      // Load and draw frame on top
      const frameImg = new Image();
      frameImg.onload = () => {
        // Save context
        ctx.save();
        
        // Flip frame horizontally to match the flipped photo
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);
        
        // Draw the frame overlay
        ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
        
        // Restore context
        ctx.restore();
        
        // Convert to data URL
        resolve(canvas.toDataURL('image/png'));
      };
      
      frameImg.onerror = () => {
        console.warn('Failed to load individual frame, returning photo without frame');
        resolve(photoDataUrl);
      };
      
      frameImg.src = frameDataUrl;
    };

    photoImg.onerror = () => {
      reject(new Error('Failed to load photo'));
    };

    photoImg.src = photoDataUrl;
  });
};
