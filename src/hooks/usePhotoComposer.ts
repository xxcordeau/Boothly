import { useCallback } from 'react';
import { TemplateConfig, FilterType } from '../types/photobooth';
import { CapturedPhoto } from '../types/photobooth';

/**
 * Apply filter to canvas context
 */
const applyFilter = (ctx: CanvasRenderingContext2D, filter: FilterType) => {
  if (filter === 'bright') {
    ctx.filter = 'brightness(1.3) contrast(1.1) saturate(1.1)';
  } else if (filter === 'grayscale') {
    ctx.filter = 'grayscale(100%) contrast(1.05)';
  } else {
    ctx.filter = 'none';
  }
};

export const composePhotos = async (
  photos: (CapturedPhoto | null)[],
  template: TemplateConfig,
  filter: FilterType = 'normal',
  customText?: string,
  qrCodeDataUrl?: string, // Pre-generated QR code data URL
  includeDate?: boolean,
  mode?: 'basic' | 'special' // Mode determines frame layer order
): Promise<string> => {
      return new Promise(async (resolve, reject) => {
        try {
          // Create canvas with template dimensions
          const canvas = document.createElement('canvas');
          canvas.width = template.canvasWidth;
          canvas.height = template.canvasHeight;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          // Function to draw frame (can be called before or after photos depending on mode)
          const drawFrame = async () => {
            if (template.compositeFrameUrl) {
              try {
                const layerPosition = mode === 'basic' ? 'bottom (behind photos)' : 'top (on top of photos)';
                console.log(`🖼️ Drawing composite frame at ${layerPosition}...`, template.compositeFrameUrl.substring(0, 100));
                const frameImg = new Image();
                
                // CRITICAL: Set crossOrigin BEFORE setting src to avoid CORS taint (only for external URLs)
                if (!template.compositeFrameUrl.startsWith('data:')) {
                  frameImg.crossOrigin = 'anonymous';
                  console.log('🔓 Set crossOrigin=anonymous for frame image');
                }
                
                await new Promise<void>((resolveFrame, rejectFrame) => {
                  frameImg.onload = () => {
                    console.log('✅ Composite frame loaded, drawing...', {
                      width: frameImg.width,
                      height: frameImg.height,
                      naturalWidth: frameImg.naturalWidth,
                      naturalHeight: frameImg.naturalHeight
                    });
                    // Draw frame on top of all photos
                    ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
                    console.log('✅ Frame drawn to canvas successfully');
                    resolveFrame();
                  };
                  frameImg.onerror = (err) => {
                    console.error('❌ Failed to load composite frame image:', err);
                    resolveFrame(); // Continue without frame
                  };
                  
                  console.log('🔄 Loading frame image from:', template.compositeFrameUrl.substring(0, 100));
                  frameImg.src = template.compositeFrameUrl;
                });
              } catch (err) {
                console.error('❌ Error loading composite frame:', err);
                // Continue without frame
              }
            }
          };

          // Function to finalize the canvas (QR code, date, etc - but NOT frame)
          const finalizeCanvas = async () => {
            // Add custom text if provided
            if (customText) {
              ctx.fillStyle = '#000000';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              ctx.fillText(customText, canvas.width / 2, canvas.height - 30);
            }

            // Add QR code if provided
            if (qrCodeDataUrl) {
              try {
                console.log('🔲 Attempting to add QR code to composition...');
                console.log('📏 QR code data URL length:', qrCodeDataUrl.length);
                console.log('🔤 QR code prefix:', qrCodeDataUrl.substring(0, 50));
                
                // Validate QR code data URL format
                if (!qrCodeDataUrl.startsWith('data:image/')) {
                  console.error('❌ Invalid QR code format - must be a data URL');
                  throw new Error(`Invalid QR code data URL format: ${qrCodeDataUrl.substring(0, 30)}`);
                }
                
                // Create a new Image object for the QR code
                const qrImg = new Image();
                
                // Wait for QR code image to load with timeout
                await new Promise<void>((resolveQR, rejectQR) => {
                  let loadTimeout: NodeJS.Timeout;
                  
                  // Set up timeout (3 seconds should be more than enough for a data URL)
                  loadTimeout = setTimeout(() => {
                    console.error('❌ QR code image load timeout after 3 seconds');
                    qrImg.src = ''; // Clear src to stop loading
                    rejectQR(new Error('QR code image load timeout (3s)'));
                  }, 3000);
                  
                  // Success handler
                  qrImg.onload = () => {
                    clearTimeout(loadTimeout);
                    console.log('✅ QR code image loaded:', {
                      width: qrImg.width,
                      height: qrImg.height,
                      naturalWidth: qrImg.naturalWidth,
                      naturalHeight: qrImg.naturalHeight
                    });
                    resolveQR();
                  };
                  
                  // Error handler
                  qrImg.onerror = (event) => {
                    clearTimeout(loadTimeout);
                    console.error('❌ QR code image load error event:', event);
                    rejectQR(new Error('QR code image failed to load'));
                  };
                  
                  // Set the src to start loading (data URLs should load instantly)
                  console.log('🔄 Setting QR code image src...');
                  qrImg.src = qrCodeDataUrl;
                  
                  // Check if already loaded (for data URLs this often happens synchronously)
                  if (qrImg.complete && qrImg.naturalWidth > 0) {
                    clearTimeout(loadTimeout);
                    console.log('✅ QR code image already loaded (synchronous)');
                    resolveQR();
                  }
                });
                
                // QR code loaded successfully, now draw it
                const qrSize = Math.min(canvas.width * 0.12, 150); // 12% of width, max 150px
                const padding = 20;
                
                console.log('🎨 Drawing QR code:', { qrSize, padding, canvasWidth: canvas.width });
                
                // Draw white background for QR code
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(padding, padding, qrSize, qrSize);
                
                // Draw QR code on top of white background
                ctx.drawImage(qrImg, padding, padding, qrSize, qrSize);
                
                console.log('✅ QR code successfully added to composition');
              } catch (err) {
                console.error('❌ Failed to add QR code to composition:', err);
                console.error('Error type:', err instanceof Error ? err.constructor.name : typeof err);
                console.error('Error message:', err instanceof Error ? err.message : String(err));
                console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
                console.warn('⚠️ Continuing without QR code...');
                // Continue composition without QR code - this is not critical
              }
            }

            // Step 4: Add date stamp (bottom-right) - only if includeDate is true
            if (includeDate) {
              try {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const dateText = `${year}.${month}.${day}`;
                
                const padding = 20;
                const fontSize = Math.min(canvas.width * 0.035, 28); // 3.5% of width, max 28px
                
                // Set font
                ctx.font = `600 ${fontSize}px sans-serif`;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                
                // Measure text
                const textMetrics = ctx.measureText(dateText);
                const textWidth = textMetrics.width;
                const textHeight = fontSize * 1.2; // Approximate height
                
                // Draw white background for date
                const bgPadding = 8;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(
                  canvas.width - padding - textWidth - bgPadding * 2,
                  canvas.height - padding - textHeight - bgPadding,
                  textWidth + bgPadding * 2,
                  textHeight + bgPadding
                );
                
                // Draw date text
                ctx.fillStyle = '#1e293b'; // slate-800
                ctx.fillText(
                  dateText,
                  canvas.width - padding - bgPadding,
                  canvas.height - padding - bgPadding / 2
                );
                
                console.log('✅ Date stamp added to image:', dateText);
              } catch (err) {
                console.error('Failed to add date stamp:', err);
                // Continue without date stamp if it fails
              }
            }

            // Convert to data URL (base64) for Supabase upload
            try {
              const dataUrl = canvas.toDataURL('image/png', 1.0);
              console.log('✅ Canvas converted to data URL, length:', dataUrl.length);
              resolve(dataUrl);
            } catch (err) {
              console.error('❌ Failed to convert canvas to data URL:', err);
              reject(new Error('Failed to convert canvas to data URL'));
            }
          };

          // Step 1: Draw background color
          ctx.fillStyle = template.backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Step 2: Draw white rectangles for photo positions (placeholders)
          ctx.fillStyle = '#ffffff';
          template.cutPositions.forEach((pos) => {
            ctx.fillRect(pos.x, pos.y, pos.width, pos.height);
          });

          // Step 3: For BASIC mode, draw frame BEFORE photos (at bottom layer)
          if (mode === 'basic') {
            await drawFrame();
          }

          // Count non-null photos
          const nonNullPhotos = photos.filter(p => p !== null);
          const hasAnyPhotos = nonNullPhotos.length > 0;

          // If no photos at all, just finalize
          if (!hasAnyPhotos) {
            // For SPECIAL mode, draw frame even if no photos
            if (mode === 'special') {
              await drawFrame();
            }
            await finalizeCanvas();
            return;
          }

          // Step 3: Load and draw each photo (respecting null slots)
          let loadedCount = 0;
          const totalPhotosToLoad = nonNullPhotos.length;

          photos.slice(0, template.cuts).forEach((photo, index) => {
            // Skip null photos (empty slots)
            if (!photo) {
              return;
            }

            const img = new Image();
            
            // Set crossOrigin before src to avoid CORS taint (only for external URLs, not data URLs)
            if (!photo.imageData.startsWith('data:')) {
              img.crossOrigin = 'anonymous';
            }
            
            img.onload = async () => {
              const pos = template.cutPositions[index];
              
              // Draw photo with object-fit: cover behavior
              const imgAspect = img.width / img.height;
              const boxAspect = pos.width / pos.height;
              
              let sx = 0, sy = 0, sw = img.width, sh = img.height;
              
              if (imgAspect > boxAspect) {
                // Image is wider, crop horizontally
                sw = img.height * boxAspect;
                sx = (img.width - sw) / 2;
              } else {
                // Image is taller, crop vertically
                sh = img.width / boxAspect;
                sy = (img.height - sh) / 2;
              }

              // Apply filter before drawing
              applyFilter(ctx, filter);

              ctx.drawImage(
                img,
                sx, sy, sw, sh,
                pos.x, pos.y, pos.width, pos.height
              );

              // Reset filter
              ctx.filter = 'none';

              loadedCount++;
              if (loadedCount === totalPhotosToLoad) {
                // All photos loaded
                // For SPECIAL mode, draw frame AFTER photos (on top layer)
                if (mode === 'special') {
                  await drawFrame();
                }
                // Then finalize with QR, date, etc
                await finalizeCanvas();
              }
            };

            img.onerror = () => {
              reject(new Error(`Failed to load photo ${index + 1}`));
            };

            img.src = photo.imageData;
          });
        } catch (err) {
          reject(err);
        }
      });
};

export const usePhotoComposer = () => {
  const composePhotosFn = useCallback(
    async (
      photos: (CapturedPhoto | null)[],
      template: TemplateConfig,
      filter: FilterType = 'normal',
      customText?: string,
      qrCodeDataUrl?: string,
      includeDate?: boolean,
      mode?: 'basic' | 'special'
    ): Promise<string> => {
      return composePhotos(photos, template, filter, customText, qrCodeDataUrl, includeDate, mode);
    },
    []
  );

  return { composePhotos: composePhotosFn };
};
